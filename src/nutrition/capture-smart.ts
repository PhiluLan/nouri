import type { Meal, MealItem } from '../types/domain';

export type MealMoment = 'now' | 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface SmartMeal extends Meal {
  occurrences: number;
  momentLabel: string;
}

export const mealMoments: { key: MealMoment; label: string; hour: number | null }[] = [
  { key: 'now', label: 'Jetzt', hour: null },
  { key: 'breakfast', label: 'Frühstück', hour: 8 },
  { key: 'lunch', label: 'Mittag', hour: 12 },
  { key: 'snack', label: 'Snack', hour: 16 },
  { key: 'dinner', label: 'Abend', hour: 19 },
];

export function eatenAtForMoment(moment: MealMoment, now = new Date()): string {
  if (moment === 'now') return now.toISOString();
  const hour = mealMoments.find((entry) => entry.key === moment)?.hour ?? now.getHours();
  const result = new Date(now);
  result.setHours(hour, 0, 0, 0);
  return result.toISOString();
}

export function smartMeals(meals: Meal[], limit = 4): SmartMeal[] {
  const groups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const signature = mealSignature(meal);
    groups.set(signature, [...(groups.get(signature) ?? []), meal]);
  }
  return [...groups.values()]
    .map((group) => {
      const ordered = [...group].sort((a, b) => b.eaten_at.localeCompare(a.eaten_at));
      const latest = ordered[0];
      return { ...latest, occurrences: group.length, momentLabel: momentForDate(new Date(latest.eaten_at)) };
    })
    .sort((a, b) => b.occurrences - a.occurrences || b.eaten_at.localeCompare(a.eaten_at))
    .slice(0, limit);
}

export function cloneMealItems(items: MealItem[]): MealItem[] {
  return items.map(({ id: _id, ...item }) => ({
    ...item,
    nutrients_per_100g: { ...item.nutrients_per_100g },
    nutrients_for_amount: { ...item.nutrients_for_amount },
    missing_nutrients: [...item.missing_nutrients],
  }));
}

export function mealEmoji(text: string): string {
  const value = text.toLowerCase();
  if (value.includes('kaffee')) return '☕️';
  if (value.includes('tee')) return '🫖';
  if (value.includes('wasser')) return '💧';
  if (value.includes('joghurt') || value.includes('hafer')) return '🥣';
  if (value.includes('brot') || value.includes('toast')) return '🥪';
  if (value.includes('salat')) return '🥗';
  if (value.includes('pasta') || value.includes('spaghetti')) return '🍝';
  if (value.includes('banane') || value.includes('apfel') || value.includes('obst')) return '🍎';
  return '🍽️';
}

export function momentForDate(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return 'Morgens';
  if (hour < 14) return 'Mittags';
  if (hour < 18) return 'Nachmittags';
  return 'Abends';
}

function mealSignature(meal: Meal): string {
  const itemNames = meal.meal_items.map((item) => item.display_name.trim().toLowerCase()).sort();
  return itemNames.length ? itemNames.join('|') : meal.raw_text.trim().toLowerCase();
}
