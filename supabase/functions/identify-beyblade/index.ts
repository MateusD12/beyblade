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
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No image provided");
    }

const systemPrompt = `Você é um especialista em Beyblades. Analise a imagem e identifique a Beyblade mostrada.

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:

{
  "identified": true/false,
  "confidence": "high/medium/low",
  "name": "Nome oficial da Beyblade (Takara Tomy)",
  "name_hasbro": "Nome da versão Hasbro (se diferente)",
  "series": "Nome da série (Beyblade X / Beyblade Burst / Metal Fight Beyblade)",
  "generation": "Geração específica (ex: Xtreme Gear, Dynamite Battle, Metal Fusion, etc)",
  "type": "Tipo em português: Ataque / Defesa / Stamina / Equilíbrio",
  "components": {
    // APENAS componentes relevantes para a série detectada:
    // Beyblade X: blade, ratchet, bit
    // Burst: layer, disk, driver
    // Metal Fight: face_bolt, energy_ring, fusion_wheel, spin_track, performance_tip
    "descriptions": {
      // Descrição de cada componente listado
    }
  },
  "specs": {
    "weight": "Peso aproximado em gramas",
    "attack": "1-10",
    "defense": "1-10", 
    "stamina": "1-10"
  },
  "description": "Descrição breve sobre esta Beyblade, suas características e histórico",
  "error_message": "Mensagem de erro se não conseguir identificar"
}

REGRAS DE TRADUÇÃO DE TIPOS (OBRIGATÓRIO):
- Attack → Ataque
- Defense → Defesa
- Stamina → Stamina (NUNCA use "Resistência")
- Balance → Equilíbrio

Se a imagem tiver baixa qualidade e não conseguir identificar com certeza, retorne:
{
  "identified": false,
  "confidence": "low",
  "suggestions": ["Possível Beyblade A", "Possível Beyblade B"],
  "error_message": "Imagem com baixa qualidade. Considere tirar uma foto mais nítida."
}

Se não conseguir identificar a Beyblade ou se a imagem não mostrar uma Beyblade, retorne:
{
  "identified": false,
  "error_message": "Motivo pelo qual não foi possível identificar"
}`;

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
            content: [
              {
                type: "text",
                text: "Identifique esta Beyblade na imagem:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      beyblade = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      beyblade = {
        identified: false,
        error_message: "Failed to parse AI response",
      };
    }

    return new Response(JSON.stringify(beyblade), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in identify-beyblade function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
