// Ordem de lançamento das séries (mais nova primeiro = número menor)
export const SERIES_ORDER: Record<string, number> = {
  'Beyblade X': 1,
  'Beyblade Burst': 2,
  'Metal Fight': 3,
  'Original': 4,
};

// Ordem de lançamento das gerações (mais nova primeiro = número menor)
// IMPORTANTE: Use nomes normalizados (canônicos) aqui
export const GENERATION_ORDER: Record<string, number> = {
  // Beyblade X
  'Xtreme Gear Sports': 1,
  'UX System': 2,
  'Basic Line': 3,
  
  // Beyblade Burst (Hasbro localizations)
  'QuadStrike': 1,
  'QuadDrive': 2,
  'SpeedStorm': 3, // Inclui Surge, SpeedStorm System, etc.
  
  // Beyblade Burst (Takara Tomy)
  'Dynamite Battle': 4,
  'Superking': 5, // Inclui Sparking
  'GT': 6,
  'Cho-Z': 7,
  'Turbo': 8,
  'God': 9,
  'Evolution': 10,
  'Dual Layer': 11,
  'Single Layer': 12,
  
  // Metal Fight
  'Hybrid Wheel System': 1,
  'Maximum Series': 2,
  '4D System': 3,
  'Metal Fury': 4,
  'Metal Masters': 5,
  'Metal Fusion': 6,
};

export function getSeriesOrder(series: string): number {
  return SERIES_ORDER[series] ?? 999;
}

export function getGenerationOrder(generation: string): number {
  return GENERATION_ORDER[generation] ?? 999;
}
