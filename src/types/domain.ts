export const NUTRIENT_KEYS = [
  'protein',
  'fiber',
  'calcium',
  'iron',
  'potassium',
  'vitaminC',
  'vitaminB12',
  'folate',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutrientMap = Partial<Record<NutrientKey, number>>;
export type Confidence = 'high' | 'medium' | 'low';

export interface Profile {
  id: string;
  birth_year: number;
  sex: 'female' | 'male' | 'other' | 'prefer_not';
  weight_kg: number | null;
  pregnant: boolean;
  breastfeeding: boolean;
  diet: string[];
  allergies: string[];
  reference_source: string;
  reference_version: string;
  onboarded_at: string;
}

export interface MealItem {
  id?: string;
  display_name: string;
  amount_g: number;
  portion_label: string;
  quantity_confidence: Confidence;
  match_confidence: Confidence;
  fdc_id: number | null;
  fdc_description: string | null;
  data_type: string | null;
  nutrients_per_100g: NutrientMap;
  nutrients_for_amount: NutrientMap;
  missing_nutrients: NutrientKey[];
  source_url: string | null;
  notes: string | null;
}

export interface Meal {
  id: string;
  raw_text: string;
  eaten_at: string;
  created_at: string;
  meal_items: MealItem[];
}

export interface ParsedMeal {
  raw_text: string;
  items: MealItem[];
  warnings: string[];
}

export interface NutrientReference {
  key: NutrientKey;
  label: string;
  unit: 'g' | 'mg' | 'µg';
  target: number;
  source: string;
}

export interface NutrientTotal {
  key: NutrientKey;
  amount: number | null;
  knownItems: number;
  totalItems: number;
  complete: boolean;
}

export interface Recommendation {
  food: string;
  reason: string;
  nutrient: NutrientKey;
}
