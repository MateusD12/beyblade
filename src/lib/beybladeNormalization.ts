// Mapeamento de nomes variantes para o nome canônico de séries
export const SERIES_ALIASES: Record<string, string> = {
  // Metal Fight variations
  'Metal Fight Beyblade': 'Metal Fight',
  'Metal Fight': 'Metal Fight',
  'MFB': 'Metal Fight',
  
  // Beyblade Burst variations
  'Beyblade Burst': 'Beyblade Burst',
  'Burst': 'Beyblade Burst',
  
  // Beyblade X variations
  'Beyblade X': 'Beyblade X',
  'BX': 'Beyblade X',
  
  // Original
  'Original': 'Original',
  'Bakuten Shoot Beyblade': 'Original',
};

// Mapeamento de nomes variantes para o nome canônico de gerações
export const GENERATION_ALIASES: Record<string, string> = {
  // === SpeedStorm / Surge variations ===
  'Speedstorm': 'SpeedStorm',
  'SpeedStorm': 'SpeedStorm',
  'SpeedStorm System': 'SpeedStorm',
  'Beyblade Burst Surge (SpeedStorm)': 'SpeedStorm',
  'Beyblade Burst Surge(SpeedStorm)': 'SpeedStorm',
  'Surge': 'SpeedStorm',
  'Surge System': 'SpeedStorm',
  
  // === QuadStrike variations ===
  'QuadStrike': 'QuadStrike',
  'QuadStrike System': 'QuadStrike',
  'Quad Strike': 'QuadStrike',
  
  // === QuadDrive variations ===
  'QuadDrive': 'QuadDrive',
  'QuadDrive System': 'QuadDrive',
  'Quad Drive': 'QuadDrive',
  
  // === Dynamite Battle / DB variations ===
  'Dynamite Battle': 'Dynamite Battle',
  'DB': 'Dynamite Battle',
  
  // === Superking / Sparking variations ===
  'Superking': 'Superking',
  'Sparking': 'Superking',
  'Super King': 'Superking',
  
  // === Beyblade Burst - outras gerações ===
  'GT': 'GT',
  'Gachi': 'GT',
  'Cho-Z': 'Cho-Z',
  'Cho Z': 'Cho-Z',
  'Turbo': 'Turbo',
  'God': 'God',
  'Evolution': 'Evolution',
  'Single Layer': 'Single Layer',
  'Dual Layer': 'Dual Layer',
  
  // === Metal Fight gerações ===
  'Hybrid Wheel System': 'Hybrid Wheel System',
  'HWS': 'Hybrid Wheel System',
  '4D System': '4D System',
  '4D': '4D System',
  'Metal Fury': 'Metal Fury',
  'Metal Masters': 'Metal Masters',
  'Metal Fusion': 'Metal Fusion',
  'Maximum Series': 'Maximum Series',
  
  // === Beyblade X gerações ===
  'Basic Line': 'Basic Line',
  'UX System': 'UX System',
  'UX': 'UX System',
  'Xtreme Gear Sports': 'Xtreme Gear Sports',
  'XGS': 'Xtreme Gear Sports',
};

/**
 * Normaliza o nome da série para um formato canônico
 */
export function normalizeSeries(series: string): string {
  if (!series) return series;
  
  // Tenta encontrar exatamente
  if (SERIES_ALIASES[series]) {
    return SERIES_ALIASES[series];
  }
  
  // Tenta encontrar ignorando case
  const lowerSeries = series.toLowerCase();
  for (const [key, value] of Object.entries(SERIES_ALIASES)) {
    if (key.toLowerCase() === lowerSeries) {
      return value;
    }
  }
  
  return series;
}

/**
 * Normaliza o nome da geração para um formato canônico
 */
export function normalizeGeneration(generation: string): string {
  if (!generation) return generation;
  
  // Tenta encontrar exatamente
  if (GENERATION_ALIASES[generation]) {
    return GENERATION_ALIASES[generation];
  }
  
  // Tenta encontrar ignorando case
  const lowerGen = generation.toLowerCase();
  for (const [key, value] of Object.entries(GENERATION_ALIASES)) {
    if (key.toLowerCase() === lowerGen) {
      return value;
    }
  }
  
  // Tenta match parcial para casos como "Beyblade Burst Surge (SpeedStorm)"
  for (const [key, value] of Object.entries(GENERATION_ALIASES)) {
    if (generation.includes(key) || key.includes(generation)) {
      return value;
    }
  }
  
  return generation;
}

/**
 * Normaliza tanto série quanto geração de uma vez
 */
export function normalizeBeyblade(series: string, generation: string): { series: string; generation: string } {
  return {
    series: normalizeSeries(series),
    generation: normalizeGeneration(generation),
  };
}
