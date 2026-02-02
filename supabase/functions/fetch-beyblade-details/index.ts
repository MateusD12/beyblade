import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!slug) {
      throw new Error("No slug provided");
    }

    console.log("Fetching Beyblade details for:", slug);

    // Create Supabase client for storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the page title first with timeout
    const pageUrl = `https://beyblade.fandom.com/api.php?action=parse&page=${encodeURIComponent(slug)}&format=json&prop=categories`;
    
    const pageController = new AbortController();
    const pageTimeout = setTimeout(() => pageController.abort(), 8000);
    
    let pageResponse;
    try {
      pageResponse = await fetch(pageUrl, {
        headers: { "User-Agent": "BeyCollection/1.0" },
        signal: pageController.signal,
      });
    } catch (fetchError) {
      clearTimeout(pageTimeout);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Page fetch timed out");
        throw new Error("Request timed out - try again");
      }
      throw fetchError;
    }
    
    clearTimeout(pageTimeout);

    if (!pageResponse.ok) {
      console.error("Fandom API error:", pageResponse.status);
      throw new Error("Failed to fetch Beyblade page");
    }

    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      console.error("Page not found:", pageData.error);
      throw new Error("Beyblade page not found");
    }

    const categories = pageData.parse?.categories?.map((c: { "*": string }) => c["*"]) || [];
    const pageTitle = pageData.parse?.title || slug;

    console.log("Page title:", pageTitle);

    // Fetch the wiki image URL and optionally save to storage
    let wikiImageUrl: string | null = null;
    let savedImageUrl: string | null = null;
    
    try {
      // Fetch thumbnail (faster) + original as fallback
      const imageApiUrl = `https://beyblade.fandom.com/api.php?action=query&titles=${encodeURIComponent(slug)}&prop=pageimages&format=json&piprop=thumbnail|original&pithumbsize=400&redirects=1`;
      console.log("Fetching image from:", imageApiUrl);
      
      const imgApiController = new AbortController();
      const imgApiTimeout = setTimeout(() => imgApiController.abort(), 5000);
      
      const imageResponse = await fetch(imageApiUrl, {
        headers: { "User-Agent": "BeyCollection/1.0" },
        signal: imgApiController.signal,
      });
      
      clearTimeout(imgApiTimeout);
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const pages = imageData.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId !== "-1") {
            const page = pages[pageId];
            // Prefer thumbnail (faster), fallback to original
            wikiImageUrl = page.thumbnail?.source || page.original?.source || null;
            console.log("Found wiki image URL:", wikiImageUrl);
          }
        }
      }
    } catch (imgApiError) {
      console.error("Error fetching image API:", imgApiError);
    }

    // Try to download and save image to storage (optional - don't block on failure)
    if (wikiImageUrl) {
      try {
        const imgController = new AbortController();
        const imgTimeout = setTimeout(() => imgController.abort(), 10000);
        
        console.log("Downloading image from wiki...");
        const imgResponse = await fetch(wikiImageUrl, {
          headers: { 
            "User-Agent": "BeyCollection/1.0",
            "Referer": "https://beyblade.fandom.com/",
          },
          signal: imgController.signal,
        });
        
        clearTimeout(imgTimeout);
        
        if (imgResponse.ok) {
          const imageBuffer = await imgResponse.arrayBuffer();
          const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
          const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          
          const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
          const fileName = `wiki/${sanitizedSlug}.${extension}`;
          
          console.log("Uploading image to storage:", fileName);
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('beyblade-photos')
            .upload(fileName, imageBuffer, {
              contentType,
              upsert: true,
            });
          
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('beyblade-photos')
              .getPublicUrl(fileName);
            
            savedImageUrl = urlData.publicUrl;
            console.log("Image saved successfully:", savedImageUrl);
          }
        } else {
          console.error("Image download failed with status:", imgResponse.status);
        }
      } catch (imgDownloadError) {
        console.error("Image download timed out or failed:", imgDownloadError);
        // Continue with wiki URL as fallback
      }
    }

    // Use saved image URL, or fallback to wiki URL directly
    const finalImageUrl = savedImageUrl || wikiImageUrl;
    console.log("Final image URL:", finalImageUrl);

    // Use Gemini to search for information in Portuguese
    const searchPrompt = `Você é um especialista em Beyblade. Busque informações sobre a Beyblade "${pageTitle}" e retorne dados estruturados em português brasileiro.

IMPORTANTE: Cada série de Beyblade tem componentes DIFERENTES. Identifique a série correta e retorne APENAS os componentes relevantes para aquela série. NÃO coloque "Não aplicável" - simplesmente omita componentes que não existem para aquela série.

**Estrutura de componentes por série:**

Beyblade X (sistema mais recente, 2023+):
- blade: Nome da Lâmina (ex: Dran Sword, Wizard Arrow, Knight Shield)
- ratchet: Catraca (ex: 3-60, 5-80, 4-70)  
- bit: Ponteira (ex: Ball, Flat, GP, High Needle)

Beyblade Burst (God, Cho-Z, GT, Sparking/Superking, Dynamite Battle):
- layer: Camada de Energia
- disk: Disco (ex: 0, 7, Blitz, Around)
- driver: Driver (ex: Xtreme, Bearing, Destroy)

Beyblade Burst QuadStrike/QuadDrive (Hasbro):
- energy_layer: Camada de Energia (ex: Chain Kerbeus K8)
- strike_chip: Strike Chip (ex: Kerbeus K8)
- gravity_ring: Anel de Gravidade (ex: 6)
- forge_disc: Disco Forjado (ex: Aquilon-Q)
- performance_tip: Ponta de Desempenho (ex: Revolve-Q)
- armor_tip: Ponta de Armadura (ex: Yard-6)

Metal Fight Beyblade (2008-2012):
- face_bolt: Parafuso Facial (decorativo com símbolo)
- energy_ring: Anel de Energia/Clear Wheel (anel de plástico colorido)
- fusion_wheel: Roda de Fusão/Metal Wheel (anel metálico principal)
- spin_track: Trilho de Giro (ex: 105, 145, 230)
- performance_tip: Ponta de Desempenho (ex: RF, WD, B, HF)

Gerações Metal Fight:
- Metal Fusion: Storm Pegasus, Rock Leone, Dark Bull, Lightning L-Drago
- Metal Masters: Meteo L-Drago, Gravity Destroyer, Ray Unicorno
- Metal Fury/4D: Big Bang Pegasus, L-Drago Destructor, Phantom Orion
- Shogun Steel/Zero-G: Samurai Ifrit, Ninja Salamander

Responda APENAS com um JSON válido:

{
  "identified": true,
  "confidence": "high",
  "manufacturer": "Takara Tomy / Hasbro / Ambos",
  "name": "${pageTitle}",
  "name_hasbro": "Nome Hasbro se diferente, ou null",
  "version_notes": "Diferenças entre versões Takara/Hasbro (cores, componentes, etc) ou null",
  "series": "Série exata (Beyblade X / Beyblade Burst / Metal Fight Beyblade)",
  "generation": "Linha específica (Xtreme Gear, QuadStrike, God, Metal Fusion, etc)",
  "type": "Tipo: Ataque/Defesa/Stamina/Equilíbrio",
  "components": {
    // APENAS os componentes que existem para esta série
    // Por exemplo, para Beyblade X: blade, ratchet, bit
    // NÃO inclua componentes que não existem nesta série
    "descriptions": {
      // Descrição detalhada de cada componente listado acima
    }
  },
  "specs": {
    "weight": "Peso em gramas",
    "attack": "1-10",
    "defense": "1-10", 
    "stamina": "1-10"
  },
  "description": "Descrição completa em português"
}

Categorias da wiki: ${categories.join(", ")}

REGRAS DE TRADUÇÃO DE TIPOS (OBRIGATÓRIO):
- "Attack" → "Ataque"
- "Defense" → "Defesa"
- "Stamina" → "Stamina" (NUNCA use "Resistência")
- "Balance" → "Equilíbrio"

IDENTIFICAÇÃO DE FABRICANTE:
- Se foi lançada apenas no Japão: "Takara Tomy"
- Se foi lançada apenas no ocidente: "Hasbro"
- Se foi lançada em ambos mercados: "Ambos"
- Versões Hasbro geralmente têm nomes diferentes (ex: Valkyrie → Valtryek)

TODAS as informações em português brasileiro. Não inclua campos com "Não aplicável".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "user", 
            content: searchPrompt
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

    console.log("AI response received");

    // Parse the JSON response from the AI
    let beyblade;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      beyblade = JSON.parse(cleanContent);
      beyblade.name = pageTitle;
      beyblade.wiki_url = `https://beyblade.fandom.com/wiki/${slug}`;
      beyblade.image_url = finalImageUrl;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Determine type and series from categories
      let type = "Equilíbrio";
      let series = "Beyblade";
      let generation = "";
      
      if (categories.some((c: string) => c.toLowerCase().includes("attack"))) type = "Ataque";
      else if (categories.some((c: string) => c.toLowerCase().includes("defense"))) type = "Defesa";
      else if (categories.some((c: string) => c.toLowerCase().includes("stamina"))) type = "Stamina";
      
      if (categories.some((c: string) => c.toLowerCase().includes("beyblade x"))) {
        series = "Beyblade X";
        generation = "Xtreme Gear";
      } else if (categories.some((c: string) => c.toLowerCase().includes("burst"))) {
        series = "Beyblade Burst";
      } else if (categories.some((c: string) => c.toLowerCase().includes("metal"))) {
        series = "Metal Fight Beyblade";
        if (categories.some((c: string) => c.toLowerCase().includes("4d") || c.toLowerCase().includes("fury"))) {
          generation = "Metal Fury";
        } else if (categories.some((c: string) => c.toLowerCase().includes("masters"))) {
          generation = "Metal Masters";
        } else {
          generation = "Metal Fusion";
        }
      }
      
      beyblade = {
        identified: true,
        confidence: "medium",
        manufacturer: "Desconhecido",
        name: pageTitle,
        series: series,
        generation: generation,
        type: type,
        wiki_url: `https://beyblade.fandom.com/wiki/${slug}`,
        image_url: finalImageUrl,
      };
    }

    console.log("Successfully extracted Beyblade details:", beyblade.name, "with image:", beyblade.image_url);

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
