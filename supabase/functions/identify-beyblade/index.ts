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

const systemPrompt = `Você é um especialista mundial em Beyblades de TODAS as gerações. Analise a imagem e identifique a Beyblade mostrada com máxima precisão.

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:

{
  "identified": true/false,
  "confidence": "high/medium/low",
  "manufacturer": "Takara Tomy / Hasbro / Ambos",
  "name": "Nome oficial da Beyblade (versão Takara Tomy)",
  "name_hasbro": "Nome da versão Hasbro (se diferente, senão null)",
  "version_notes": "Diferenças entre versões se aplicável (cores, stickers, componentes)",
  "series": "Nome da série (Beyblade X / Beyblade Burst / Metal Fight Beyblade)",
  "generation": "Geração específica",
  "type": "Tipo em português: Ataque / Defesa / Stamina / Equilíbrio",
  "components": {
    // APENAS os componentes relevantes para a série detectada (ver lista abaixo)
    "descriptions": {
      // Descrição detalhada de cada componente listado
    }
  },
  "specs": {
    "weight": "Peso aproximado em gramas",
    "attack": "1-10",
    "defense": "1-10", 
    "stamina": "1-10"
  },
  "description": "Descrição breve sobre esta Beyblade, características e histórico",
  "suggestions": ["Alternativa 1", "Alternativa 2"],
  "error_message": "Mensagem de erro se não conseguir identificar"
}

═══════════════════════════════════════════════════════════════
IDENTIFICAÇÃO DE FABRICANTE (HASBRO vs TAKARA TOMY)
═══════════════════════════════════════════════════════════════

TAKARA TOMY (versão japonesa original):
- Nomes originais em japonês/inglês oficial
- Cores mais vibrantes e fiéis ao anime
- Stickers de melhor qualidade
- Componentes de metal mais pesados
- Embalagens com texto em japonês

HASBRO (versão ocidental):
- Nomes adaptados para o mercado ocidental
- Cores frequentemente diferentes (mais claras ou simplificadas)
- Alguns componentes podem ser de plástico em vez de metal
- Stickers simplificados ou impressos
- Pode ter sistema de travamento diferente (Burst)
- Embalagens em inglês/português

Exemplos de diferenças de nomes:
- TT: "Dranzer Spiral" → Hasbro: "Dranzer S"
- TT: "Valkyrie Wing Accel" → Hasbro: "Valtryek V2"
- TT: "Spriggan Requiem" → Hasbro: "Spryzen Requiem"

═══════════════════════════════════════════════════════════════
ESTRUTURA DE COMPONENTES POR SÉRIE
═══════════════════════════════════════════════════════════════

BEYBLADE X (2023+):
Sistema de 3 partes com Xtreme Gear:
- blade: Nome da lâmina (ex: "Dran Sword", "Wizard Arrow")
- ratchet: Código do ratchet (ex: "3-60", "4-80", "5-70")
- bit: Nome do bit (ex: "Ball", "Flat", "High Needle")

BEYBLADE BURST (God, Cho-Z, GT, Sparking/Superking, Dynamite Battle):
Sistema de 3 partes:
- layer: Nome do layer (ex: "Valkyrie", "Spriggan", "Longinus")
- disk: Nome/código do disco (ex: "Heavy", "Sting", "00")
- driver: Nome do driver (ex: "Xtreme", "Volcanic", "Evolution")

BEYBLADE BURST QUADSTRIKE/QUADDRIVE (2022-2023):
Sistema de 4-6 partes:
- energy_layer: Layer de energia superior
- strike_chip: Chip de ataque (se aplicável)
- gravity_ring: Anel de gravidade (se aplicável)
- forge_disc: Disco forjado
- performance_tip: Ponta de performance
- armor_tip: Ponta blindada (se aplicável)
- fusion_ring: Anel de fusão (se aplicável)

METAL FIGHT BEYBLADE (2008-2012):
Sistema de 5 partes:
- face_bolt: Parafuso decorativo (ex: "Pegasus", "Leone")
- energy_ring: Anel de energia/Clear Wheel (ex: "Pegasus I", "Bull")
- fusion_wheel: Roda de fusão/Metal Wheel (ex: "Storm", "Rock", "Flame")
- spin_track: Trilho de rotação (ex: "105", "145", "230")
- performance_tip: Ponta de performance (ex: "RF", "WD", "B")

Séries Metal Fight específicas:
- Metal Fusion: Storm Pegasus, Rock Leone, Dark Bull
- Metal Masters: Meteo L-Drago, Gravity Destroyer
- Metal Fury (4D): Big Bang Pegasus, L-Drago Destructor
- Shogun Steel: Samurai Ifrit, Ninja Salamander

═══════════════════════════════════════════════════════════════
TRADUÇÃO DE TIPOS (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════
- Attack → Ataque
- Defense → Defesa  
- Stamina → Stamina (NUNCA use "Resistência")
- Balance → Equilíbrio

═══════════════════════════════════════════════════════════════
GERAÇÕES POR SÉRIE
═══════════════════════════════════════════════════════════════

Beyblade X: 
  - Basic Line (BX) - linha inicial 2023
  - UX System (UX) - sistema UX
  - Xtreme Gear Sports (CX/XGS) - linha crossover/esportiva
Metal Fight: Metal Fusion, Metal Masters, Metal Fury/4D, Shogun Steel/Zero-G
Beyblade Burst: 
  - Single Layer, Dual Layer, God/Evolution
  - Cho-Z/Turbo, GT/Rise, Sparking/Superking
  - Dynamite Battle, QuadDrive, QuadStrike

═══════════════════════════════════════════════════════════════
ANÁLISE DE IMAGENS DE BAIXA QUALIDADE
═══════════════════════════════════════════════════════════════

Se a imagem tiver qualidade reduzida, AINDA TENTE identificar:

1. CARACTERÍSTICAS VISUAIS A ANALISAR:
   - Cor predominante (azul = Valkyrie/Pegasus, vermelho = Spriggan/L-Drago, etc)
   - Formato geral das lâminas/wings
   - Número de camadas visíveis (indica a série)
   - Sistema de componentes (metal vs plástico)
   - Logos ou marcas parcialmente visíveis
   - Formato do driver/tip/spin track

2. SE NÃO CONSEGUIR IDENTIFICAR COM CERTEZA:
   - Defina confidence: "low"
   - Liste até 3 Beyblades mais prováveis no campo "suggestions"
   - Explique as características que levaram às sugestões

3. NUNCA DESISTA FACILMENTE:
   - Mesmo com baixa qualidade, forneça suas melhores sugestões
   - Use o contexto visual disponível

RESPOSTA PARA BAIXA QUALIDADE:
{
  "identified": false,
  "confidence": "low",
  "manufacturer": "Desconhecido",
  "suggestions": ["Nome Beyblade 1", "Nome Beyblade 2", "Nome Beyblade 3"],
  "partial_analysis": {
    "detected_colors": ["azul", "vermelho"],
    "detected_series": "Provável Beyblade Burst",
    "detected_features": ["Layer com 3 lâminas", "Driver aparenta ser Xtreme"]
  },
  "error_message": "Imagem com baixa qualidade. Baseado nas características visíveis, estas são as possíveis Beyblades. Tire uma foto mais nítida para confirmação."
}

SE A IMAGEM NÃO MOSTRAR UMA BEYBLADE:
{
  "identified": false,
  "error_message": "A imagem não parece mostrar uma Beyblade. Por favor, envie uma foto de uma Beyblade."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
