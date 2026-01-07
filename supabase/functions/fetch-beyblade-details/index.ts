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
    const { slug } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!slug) {
      throw new Error("No slug provided");
    }

    console.log("Fetching Beyblade details for:", slug);

    // Fetch the wiki page content using MediaWiki API
    const pageUrl = `https://beyblade.fandom.com/api.php?action=parse&page=${encodeURIComponent(slug)}&format=json&prop=text|categories`;
    
    const pageResponse = await fetch(pageUrl, {
      headers: {
        "User-Agent": "BeyCollection/1.0",
      },
    });

    if (!pageResponse.ok) {
      console.error("Fandom API error:", pageResponse.status);
      throw new Error("Failed to fetch Beyblade page");
    }

    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      console.error("Page not found:", pageData.error);
      throw new Error("Beyblade page not found");
    }

    const htmlContent = pageData.parse?.text?.["*"] || "";
    const categories = pageData.parse?.categories?.map((c: { "*": string }) => c["*"]) || [];
    const pageTitle = pageData.parse?.title || slug;

    // Use Gemini to extract structured data from the HTML content
    const systemPrompt = `Você é um especialista em Beyblades. Analise o conteúdo HTML de uma página da wiki Beyblade Fandom e extraia informações estruturadas.

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:

{
  "identified": true,
  "confidence": "high",
  "name": "Nome oficial da Beyblade conforme aparece na página",
  "name_hasbro": "Nome da versão Hasbro (se mencionado)",
  "series": "Nome da série (Beyblade X, Beyblade Burst, Metal Fight, etc)",
  "generation": "Geração específica (ex: Burst GT, Dynamite Battle, Xtreme Gear, etc)",
  "type": "Tipo: Attack/Defense/Stamina/Balance (baseado nas categorias ou conteúdo)",
  "components": {
    "blade": "Nome do Blade/Layer",
    "ratchet": "Nome do Ratchet/Disk (ex: 3-60, 4-80)",
    "bit": "Nome do Bit/Driver (ex: F, B, HN)"
  },
  "specs": {
    "weight": "Peso se mencionado",
    "attack": "Valor de ataque se mencionado (1-10)",
    "defense": "Valor de defesa se mencionado (1-10)",
    "stamina": "Valor de stamina se mencionado (1-10)"
  },
  "description": "Breve descrição sobre esta Beyblade baseada no conteúdo da página",
  "release_date": "Data de lançamento se mencionada",
  "product_code": "Código do produto se mencionado"
}

Dicas para identificar o tipo:
- Se as categorias incluem "Attack" ou "Attack Type" → type: "Attack"
- Se as categorias incluem "Defense" ou "Defense Type" → type: "Defense"
- Se as categorias incluem "Stamina" ou "Stamina Type" → type: "Stamina"
- Se as categorias incluem "Balance" ou "Balance Type" → type: "Balance"

Para Beyblade X, os componentes são: Blade + Ratchet + Bit
Para Beyblade Burst, os componentes são: Layer + Disk + Driver
Para Metal Fight, os componentes são: Face Bolt + Energy Ring + Fusion Wheel + Spin Track + Performance Tip`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Título da página: ${pageTitle}\n\nCategorias: ${categories.join(", ")}\n\nConteúdo HTML da página:\n${htmlContent.substring(0, 15000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from the AI
    let beyblade;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      beyblade = JSON.parse(cleanContent);
      // Ensure the name matches the page title
      beyblade.name = pageTitle;
      beyblade.wiki_url = `https://beyblade.fandom.com/wiki/${slug}`;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return basic info from the page
      beyblade = {
        identified: true,
        confidence: "medium",
        name: pageTitle,
        series: categories.find((c: string) => c.includes("Beyblade")) || "Unknown",
        type: categories.find((c: string) => ["Attack", "Defense", "Stamina", "Balance"].some(t => c.includes(t))) || "Balance",
        wiki_url: `https://beyblade.fandom.com/wiki/${slug}`,
      };
    }

    console.log("Successfully extracted Beyblade details:", beyblade.name);

    return new Response(JSON.stringify(beyblade), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-beyblade-details function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
