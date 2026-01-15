export interface BeybladeComponents {
  // Beyblade X
  blade?: string;
  ratchet?: string;
  bit?: string;
  
  // Beyblade Burst (clássico)
  layer?: string;
  disk?: string;
  driver?: string;
  
  // Beyblade Burst QuadStrike/QuadDrive
  energy_layer?: string;
  forge_disc?: string;
  performance_tip?: string;
  armor_tip?: string;
  fusion_ring?: string;
  strike_chip?: string;
  gravity_ring?: string;
  
  // Metal Fight Beyblade
  face_bolt?: string;
  energy_ring?: string;
  fusion_wheel?: string;
  spin_track?: string;
  
  // Outros
  extra?: string;
  
  // Descrições aninhadas (como vem da API)
  descriptions?: Record<string, string>;
}

// Mantido para compatibilidade, mas as descrições agora vêm dentro de components.descriptions
export interface ComponentDescriptions {
  blade?: string;
  ratchet?: string;
  bit?: string;
  layer?: string;
  disk?: string;
  driver?: string;
  energy_layer?: string;
  forge_disc?: string;
  performance_tip?: string;
  armor_tip?: string;
  fusion_ring?: string;
  strike_chip?: string;
  gravity_ring?: string;
  face_bolt?: string;
  energy_ring?: string;
  fusion_wheel?: string;
  spin_track?: string;
}

export interface BeybladeSpecs {
  weight?: string;
  attack?: string;
  defense?: string;
  stamina?: string;
}

export interface Beyblade {
  id: string;
  name: string;
  name_hasbro?: string | null;
  series: string;
  generation: string;
  type: string;
  components?: BeybladeComponents | null;
  component_descriptions?: ComponentDescriptions | null;
  specs?: BeybladeSpecs | null;
  description?: string | null;
  image_url?: string | null;
  wiki_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  user_id: string;
  beyblade_id: string;
  custom_name?: string | null;
  photo_url?: string | null;
  condition: string;
  notes?: string | null;
  acquired_at?: string | null;
  spin_direction?: 'L' | 'R' | 'R/L' | null;
  created_at: string;
  updated_at: string;
  beyblade?: Beyblade;
}

export interface IdentifyResponse {
  identified: boolean;
  confidence?: 'high' | 'medium' | 'low';
  manufacturer?: 'Takara Tomy' | 'Hasbro' | 'Ambos' | 'Desconhecido';
  name?: string;
  name_hasbro?: string;
  version_notes?: string;
  series?: string;
  generation?: string;
  type?: string;
  components?: BeybladeComponents;
  component_descriptions?: ComponentDescriptions;
  specs?: BeybladeSpecs;
  description?: string;
  image_url?: string;
  wiki_url?: string;
  suggestions?: string[];
  partial_analysis?: {
    detected_colors?: string[];
    detected_series?: string;
    detected_features?: string[];
  };
  error_message?: string;
}

export type BeybladeType = 'Attack' | 'Defense' | 'Stamina' | 'Balance';

export const BEYBLADE_TYPES: BeybladeType[] = ['Attack', 'Defense', 'Stamina', 'Balance'];

export const TYPE_COLORS: Record<string, string> = {
  // Português (banco de dados) - tipos normalizados
  Ataque: 'type-attack',
  Defesa: 'type-defense',
  Stamina: 'type-stamina',
  Equilíbrio: 'type-balance',
  // English fallback (para dados legados ou APIs externas)
  Attack: 'type-attack',
  Defense: 'type-defense',
  Balance: 'type-balance',
  // Legacy fallback (dados antigos que usavam "Resistência")
  Resistência: 'type-stamina',
};
