import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching Beyblade Fandom for:", query);

    // Use MediaWiki API to search with timeout
    const searchUrl = `https://beyblade.fandom.com/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=15&format=json`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let response;
    try {
      response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "BeyCollection/1.0",
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Search request timed out");
        throw new Error("Search timed out - try again");
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Fandom API error:", response.status);
      throw new Error("Failed to search Beyblade Fandom");
    }

    const data = await response.json();
    // OpenSearch returns: [searchTerm, [titles], [descriptions], [urls]]
    const titles = data[1] || [];
    const urls = data[3] || [];

    // Filter to only include actual Beyblade entries (not categories, etc.)
    const results = titles.map((title: string, index: number) => ({
      name: title,
      url: urls[index],
      slug: title.replace(/ /g, "_"),
    })).filter((item: { name: string }) => {
      // Filter out non-Beyblade pages
      const lower = item.name.toLowerCase();
      return !lower.includes("category:") && 
             !lower.includes("template:") &&
             !lower.includes("user:") &&
             !lower.includes("file:");
    });

    console.log(`Found ${results.length} results for "${query}"`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-beyblade function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
