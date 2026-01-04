export interface BeybladeComponents {
  layer?: string;
  disk?: string;
  driver?: string;
  extra?: string;
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
  specs?: BeybladeSpecs | null;
  description?: string | null;
  image_url?: string | null;
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
  created_at: string;
  updated_at: string;
  beyblade?: Beyblade;
}

export interface IdentifyResponse {
  identified: boolean;
  confidence?: string;
  name?: string;
  name_hasbro?: string;
  series?: string;
  generation?: string;
  type?: string;
  components?: BeybladeComponents;
  specs?: BeybladeSpecs;
  description?: string;
  error_message?: string;
}

export type BeybladeType = 'Attack' | 'Defense' | 'Stamina' | 'Balance';

export const BEYBLADE_TYPES: BeybladeType[] = ['Attack', 'Defense', 'Stamina', 'Balance'];

export const TYPE_COLORS: Record<string, string> = {
  Attack: 'type-attack',
  Defense: 'type-defense',
  Stamina: 'type-stamina',
  Balance: 'type-balance',
};
