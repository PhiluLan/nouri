import { NUTRIENT_KEYS, type Meal, type MealItem, type NutrientKey, type NutrientMap, type NutrientTotal } from '../types/domain';

export function scaleNutrients(per100g: NutrientMap, amountG: number): NutrientMap {
  if (!Number.isFinite(amountG) || amountG <= 0) return {};
  const factor = amountG / 100;
  return Object.fromEntries(
    Object.entries(per100g)
      .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
      .map(([key, value]) => [key, Math.round((value as number) * factor * 100) / 100]),
  ) as NutrientMap;
}

export function updateItemAmount(item: MealItem, amountG: number): MealItem {
  return {
    ...item,
    amount_g: amountG,
    nutrients_for_amount: scaleNutrients(item.nutrients_per_100g, amountG),
  };
}

export function aggregateItems(items: MealItem[]): NutrientTotal[] {
  return NUTRIENT_KEYS.map((key) => {
    const known = items.filter((item) => typeof item.nutrients_for_amount[key] === 'number');
    return {
      key,
      amount: known.length ? round(known.reduce((sum, item) => sum + (item.nutrients_for_amount[key] ?? 0), 0)) : null,
      knownItems: known.length,
      totalItems: items.length,
      complete: items.length > 0 && known.length === items.length,
    };
  });
}

export function aggregateMeals(meals: Meal[]): NutrientTotal[] {
  return aggregateItems(meals.flatMap((meal) => meal.meal_items ?? []));
}

export function groupMealsByLocalDay(meals: Meal[], days = 7, now = new Date()): { date: string; meals: Meal[]; totals: NutrientTotal[] }[] {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (days - 1 - index));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const matching = meals.filter((meal) => {
      const eaten = new Date(meal.eaten_at);
      return eaten >= day && eaten < next;
    });
    return { date: localDateKey(day), meals: matching, totals: aggregateMeals(matching) };
  });
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function sevenDayStart(now = new Date()): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return start.toISOString();
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function hasUsableNutrientData(item: MealItem): boolean {
  return item.fdc_id !== null && Object.keys(item.nutrients_per_100g).length > 0;
}

export function missingNutrients(per100g: NutrientMap): NutrientKey[] {
  return NUTRIENT_KEYS.filter((key) => typeof per100g[key] !== 'number');
}
