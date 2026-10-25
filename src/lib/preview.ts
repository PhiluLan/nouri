import { scaleNutrients } from '../nutrition/engine';
import type { Meal, MealItem, NutrientMap, ParsedMeal, Profile } from '../types/domain';

export const isPreviewMode = process.env.EXPO_PUBLIC_PREVIEW_MODE === 'true';

export const previewProfile: Profile = {
  id: 'preview-user',
  birth_year: 1990,
  sex: 'female',
  weight_kg: 65,
  pregnant: false,
  breastfeeding: false,
  diet: [],
  allergies: [],
  reference_source: 'Lokale Vorschau – BLV-Referenzlogik',
  reference_version: 'PREVIEW',
  onboarded_at: new Date().toISOString(),
};

interface PreviewFood {
  display_name: string;
  portion_label: string;
  amount_g: number;
  nutrients: NutrientMap;
}

const catalog: Record<string, PreviewFood> = {
  hafer: { display_name: 'Haferflocken', portion_label: 'eine Schale', amount_g: 60, nutrients: { protein: 13.2, fiber: 10.1, calcium: 54, iron: 4.7, potassium: 429, vitaminC: 0, vitaminB12: 0, folate: 56 } },
  milch: { display_name: 'Milch', portion_label: 'ein Glas', amount_g: 200, nutrients: { protein: 3.4, calcium: 120, potassium: 150, vitaminB12: 0.4, folate: 5 } },
  banane: { display_name: 'Banane', portion_label: 'eine Banane', amount_g: 120, nutrients: { protein: 1.1, fiber: 2.6, calcium: 5, iron: 0.3, potassium: 358, vitaminC: 8.7, folate: 20 } },
  linsen: { display_name: 'Linsen, gekocht', portion_label: 'eine Portion', amount_g: 180, nutrients: { protein: 9, fiber: 7.9, calcium: 19, iron: 3.3, potassium: 369, vitaminC: 1.5, vitaminB12: 0, folate: 181 } },
  peperoni: { display_name: 'Rote Peperoni', portion_label: 'eine Peperoni', amount_g: 140, nutrients: { protein: 1, fiber: 2.1, calcium: 7, iron: 0.4, potassium: 211, vitaminC: 128, folate: 46 } },
};

let previewMeals: Meal[] = seedMeals();

export async function previewAnalyzeMeal(rawText: string): Promise<ParsedMeal> {
  const normalized = rawText.toLowerCase();
  const matches = Object.entries(catalog)
    .filter(([keyword]) => normalized.includes(keyword))
    .map(([, food], index) => previewItem(food, index));
  const items = matches.length ? matches : [previewItem(catalog.hafer, 0), previewItem(catalog.banane, 1)];
  return {
    raw_text: rawText,
    items,
    warnings: ['Lokale Vorschau: Erkennung und Nährstoffwerte sind ausschließlich gekennzeichnete Testdaten.'],
  };
}

export function getPreviewMeals(): Meal[] {
  return previewMeals.map((meal) => ({ ...meal, meal_items: meal.meal_items.map((item) => ({ ...item })) }));
}

export function getPreviewMeal(id: string): Meal {
  const meal = previewMeals.find((entry) => entry.id === id);
  if (!meal) throw new Error('Preview-Mahlzeit nicht gefunden.');
  return { ...meal, meal_items: meal.meal_items.map((item) => ({ ...item })) };
}

export function savePreviewMeal(input: { mealId?: string; rawText: string; eatenAt: string; items: MealItem[] }): string {
  const id = input.mealId ?? `preview-${Date.now()}`;
  const existing = previewMeals.find((meal) => meal.id === id);
  const meal: Meal = {
    id,
    raw_text: input.rawText,
    eaten_at: input.eatenAt,
    created_at: existing?.created_at ?? new Date().toISOString(),
    meal_items: input.items,
  };
  previewMeals = existing ? previewMeals.map((entry) => entry.id === id ? meal : entry) : [meal, ...previewMeals];
  return id;
}

export function deletePreviewMeal(id: string) {
  previewMeals = previewMeals.filter((meal) => meal.id !== id);
}

function previewItem(food: PreviewFood, index: number): MealItem {
  return {
    id: `preview-item-${Date.now()}-${index}`,
    display_name: food.display_name,
    amount_g: food.amount_g,
    portion_label: food.portion_label,
    quantity_confidence: 'medium',
    match_confidence: 'high',
    fdc_id: 900_000_000 + index,
    fdc_description: 'Lokaler Vorschau-Datensatz',
    data_type: 'Preview-Mock',
    nutrients_per_100g: food.nutrients,
    nutrients_for_amount: scaleNutrients(food.nutrients, food.amount_g),
    missing_nutrients: [],
    source_url: null,
    notes: 'Nur für die visuelle Vorschau; keine USDA-Produktionsdaten.',
  };
}

function seedMeals(): Meal[] {
  const today = new Date();
  today.setHours(8, 15, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(12, 30, 0, 0);
  return [
    {
      id: 'preview-breakfast',
      raw_text: 'Haferflocken mit Milch und einer Banane',
      eaten_at: today.toISOString(),
      created_at: today.toISOString(),
      meal_items: [previewItem(catalog.hafer, 1), previewItem(catalog.milch, 2), previewItem(catalog.banane, 3)],
    },
    {
      id: 'preview-lunch',
      raw_text: 'Linsen mit roter Peperoni',
      eaten_at: yesterday.toISOString(),
      created_at: yesterday.toISOString(),
      meal_items: [previewItem(catalog.linsen, 4), previewItem(catalog.peperoni, 5)],
    },
  ];
}
