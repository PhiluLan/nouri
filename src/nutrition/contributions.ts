import type { Meal, NutrientKey } from '../types/domain';

export type ContributionPeriod = 'day' | 'week' | 'month';

export interface NutrientContribution {
  mealId: string;
  mealText: string;
  eatenAt: string;
  ingredient: string;
  amount: number;
}

export interface IngredientContribution {
  ingredient: string;
  amount: number;
  mealCount: number;
}

export function periodStart(period: ContributionPeriod, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setDate(start.getDate() - 29);
  return start;
}

export function contributionsFor(meals: Meal[], key: NutrientKey, period: ContributionPeriod, now = new Date()): NutrientContribution[] {
  const start = periodStart(period, now);
  const end = new Date(now);
  return meals
    .filter((meal) => {
      const eaten = new Date(meal.eaten_at);
      return eaten >= start && eaten <= end;
    })
    .flatMap((meal) => (meal.meal_items ?? []).flatMap((item) => {
      const amount = item.nutrients_for_amount[key];
      return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? [{
        mealId: meal.id,
        mealText: meal.raw_text,
        eatenAt: meal.eaten_at,
        ingredient: item.display_name,
        amount,
      }] : [];
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupContributionsByIngredient(contributions: NutrientContribution[]): IngredientContribution[] {
  const groups = new Map<string, { ingredient: string; amount: number; meals: Set<string> }>();
  for (const contribution of contributions) {
    const normalized = contribution.ingredient.trim().toLocaleLowerCase('de-CH');
    const current = groups.get(normalized) ?? { ingredient: contribution.ingredient.trim(), amount: 0, meals: new Set<string>() };
    current.amount += contribution.amount;
    current.meals.add(contribution.mealId);
    groups.set(normalized, current);
  }
  return [...groups.values()]
    .map((group) => ({ ingredient: group.ingredient, amount: round(group.amount), mealCount: group.meals.size }))
    .sort((a, b) => b.amount - a.amount);
}

export function contributionCoverage(meals: Meal[], key: NutrientKey, period: ContributionPeriod, now = new Date()) {
  const start = periodStart(period, now);
  const end = new Date(now);
  const items = meals
    .filter((meal) => {
      const eaten = new Date(meal.eaten_at);
      return eaten >= start && eaten <= end;
    })
    .flatMap((meal) => meal.meal_items ?? []);
  return { known: items.filter((item) => typeof item.nutrients_for_amount[key] === 'number').length, total: items.length };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
