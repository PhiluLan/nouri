export const NUTRIENT_KEYS = [
  'protein', 'fiber', 'water',
  'alphaLinolenicAcid', 'epaDha', 'dha', 'linoleicAcid',
  'biotin', 'vitaminB12', 'folate', 'niacin', 'pantothenicAcid', 'riboflavin', 'thiamin',
  'vitaminA', 'vitaminB6', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'calcium', 'chloride', 'copper', 'fluoride', 'iodine', 'iron', 'magnesium', 'manganese',
  'molybdenum', 'phosphorus', 'potassium', 'selenium', 'sodium', 'zinc',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutrientMap = Partial<Record<NutrientKey, number>>;
export type Confidence = 'high' | 'medium' | 'low';
export type ReferenceSex = 'female' | 'male' | 'other' | 'prefer_not';
export type LifeStage = 'none' | 'pregnant_t1' | 'pregnant_t2' | 'pregnant_t3' | 'lactating_0_6' | 'lactating_over_6';
export type MenopauseStatus = 'pre' | 'post' | 'not_applicable';
export type PhytateLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface Profile {
  id: string;
  birth_year: number;
  sex: ReferenceSex;
  weight_kg: number | null;
  pregnant: boolean;
  breastfeeding: boolean;
  life_stage: LifeStage;
  menopause_status: MenopauseStatus;
  phytate_level: PhytateLevel;
  reference_profile_version: number;
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
  unit: 'g' | 'mg' | 'µg' | 'ml';
  target: number;
  targetMax?: number;
  kind: 'minimum' | 'range' | 'maximum';
  group: 'basis' | 'fats' | 'vitamins' | 'minerals';
  priority: number;
  source: string;
  note?: string;
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
