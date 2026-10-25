import assert from 'node:assert/strict';
import test from 'node:test';
import { contributionCoverage, contributionsFor, groupContributionsByIngredient } from '../src/nutrition/contributions';
import type { Meal } from '../src/types/domain';

const meals = [
  meal('today', '2026-10-25T12:00:00+01:00', 'Linsensalat', [item('Linsen', 7.2), item('Tomaten', 1.1)]),
  meal('yesterday', '2026-10-24T12:00:00+01:00', 'Linsensuppe', [item('Linsen', 5.3), item('Brühe')]),
  meal('old', '2026-09-10T12:00:00+02:00', 'Alter Eintrag', [item('Linsen', 8)]),
];

test('breaks a nutrient total down by ingredient without treating missing values as zero', () => {
  const now = new Date('2026-10-25T20:00:00+01:00');
  const contributions = contributionsFor(meals, 'iron', 'week', now);
  assert.equal(contributions.length, 3);
  assert.deepEqual(groupContributionsByIngredient(contributions), [
    { ingredient: 'Linsen', amount: 12.5, mealCount: 2 },
    { ingredient: 'Tomaten', amount: 1.1, mealCount: 1 },
  ]);
  assert.deepEqual(contributionCoverage(meals, 'iron', 'week', now), { known: 3, total: 4 });
});

test('uses local rolling periods for today and the last 30 days', () => {
  const now = new Date('2026-10-25T20:00:00+01:00');
  assert.equal(contributionsFor(meals, 'iron', 'day', now).length, 2);
  assert.equal(contributionsFor(meals, 'iron', 'month', now).length, 3);
});

function item(display_name: string, iron?: number) {
  return {
    display_name, amount_g: 100, portion_label: '100 g', quantity_confidence: 'high' as const, match_confidence: 'high' as const,
    fdc_id: 1, fdc_description: display_name, data_type: 'Foundation', nutrients_per_100g: iron === undefined ? {} : { iron },
    nutrients_for_amount: iron === undefined ? {} : { iron }, missing_nutrients: [], source_url: null, notes: null,
  };
}

function meal(id: string, eaten_at: string, raw_text: string, meal_items: ReturnType<typeof item>[]): Meal {
  return { id, eaten_at, raw_text, meal_items, created_at: eaten_at };
}
