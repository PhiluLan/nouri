import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateItems, groupMealsByLocalDay, missingNutrients, scaleNutrients, updateItemAmount } from '../src/nutrition/engine';
import { makeRecommendations } from '../src/nutrition/recommendations';
import { referencesFor } from '../src/nutrition/references';
import type { Meal, MealItem, Profile } from '../src/types/domain';

function item(overrides: Partial<MealItem> = {}): MealItem {
  return {
    display_name: 'Linsen', amount_g: 150, portion_label: '150 g',
    quantity_confidence: 'high', match_confidence: 'high', fdc_id: 123,
    fdc_description: 'Lentils, cooked', data_type: 'Foundation',
    nutrients_per_100g: { protein: 9, iron: 3.3, fiber: 7.9 },
    nutrients_for_amount: { protein: 13.5, iron: 4.95, fiber: 11.85 },
    missing_nutrients: ['calcium', 'potassium', 'vitaminC', 'vitaminB12', 'folate'],
    source_url: 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/123/nutrients', notes: null,
    ...overrides,
  };
}

const profile: Profile = {
  id: 'user', birth_year: 1990, sex: 'female', weight_kg: 60, pregnant: false, breastfeeding: false,
  life_stage: 'none', menopause_status: 'pre', phytate_level: 'medium', reference_profile_version: 2,
  diet: [], allergies: [], reference_source: 'BLV', reference_version: '2026-02-10', onboarded_at: '2026-01-01T00:00:00Z',
};

test('scales only documented nutrients and never fills missing values with zero', () => {
  assert.deepEqual(scaleNutrients({ protein: 10, iron: 2.5 }, 150), { protein: 15, iron: 3.75 });
  assert.equal(scaleNutrients({ fluoride: 0.025 }, 50).fluoride, 0.0125);
  assert.equal(scaleNutrients({ protein: 10 }, 0).protein, undefined);
  assert.ok(missingNutrients({ protein: 10 }).includes('vitaminB12'));
});

test('amount correction deterministically recalculates values', () => {
  const changed = updateItemAmount(item(), 200);
  assert.equal(changed.nutrients_for_amount.protein, 18);
  assert.equal(changed.nutrients_for_amount.iron, 6.6);
});

test('aggregate marks a nutrient incomplete instead of treating unknown as zero', () => {
  const totals = aggregateItems([item(), item({ display_name: 'Unvollständig', nutrients_for_amount: { protein: 5 } })]);
  const iron = totals.find((value) => value.key === 'iron');
  assert.equal(iron?.amount, 4.95);
  assert.equal(iron?.knownItems, 1);
  assert.equal(iron?.totalItems, 2);
  assert.equal(iron?.complete, false);
});

test('reference selection covers the complete adult nouri set and adapts weight and life stage', () => {
  const standard = referencesFor(profile, 2026);
  assert.equal(standard.length, 33);
  assert.equal(standard.find((value) => value.key === 'protein')?.target, 49.8);
  assert.equal(standard.find((value) => value.key === 'zinc')?.target, 9.3);
  const pregnant = referencesFor({ ...profile, pregnant: true, life_stage: 'pregnant_t2' }, 2026);
  assert.equal(pregnant.length, 34);
  assert.equal(pregnant.find((value) => value.key === 'protein')?.target, 58.8);
  assert.equal(pregnant.find((value) => value.key === 'folate')?.target, 550);
  assert.equal(pregnant.find((value) => value.key === 'iron')?.target, 30);
});

test('reference selection handles menopause, older adults and phytate-specific zinc', () => {
  const post = referencesFor({ ...profile, menopause_status: 'post', phytate_level: 'very_high' }, 2026);
  assert.equal(post.find((value) => value.key === 'iron')?.target, 11);
  assert.equal(post.find((value) => value.key === 'zinc')?.target, 12.7);
  const older = referencesFor({ ...profile, birth_year: 1950 }, 2026);
  assert.equal(older.find((value) => value.key === 'protein')?.target, 60);
  assert.equal(older.find((value) => value.key === 'protein')?.targetMax, 72);
  assert.equal(older.find((value) => value.key === 'vitaminD')?.target, 20);
  assert.equal(older.find((value) => value.key === 'calcium')?.targetMax, 1200);
});

test('recommendations respect vegan restrictions and remain capped at three', () => {
  const totals = aggregateItems([item({ nutrients_for_amount: { protein: 5, iron: 1, fiber: 2, calcium: 10, potassium: 100, vitaminC: 2, vitaminB12: 0.1, folate: 10 } })]);
  const recommendations = makeRecommendations(totals, referencesFor(profile, 2026), { diet: ['vegan'], allergies: [] });
  assert.ok(recommendations.length <= 3);
  assert.ok(recommendations.every((value) => !['Naturjoghurt', 'Lachs', 'Ei'].includes(value.food)));
});

test('seven-day grouping retains empty days', () => {
  const now = new Date('2026-10-25T12:00:00+01:00');
  const meals: Meal[] = [{ id: '1', raw_text: 'Linsen', eaten_at: '2026-10-25T08:00:00+01:00', created_at: '2026-10-25T08:00:00+01:00', meal_items: [item()] }];
  const days = groupMealsByLocalDay(meals, 7, now);
  assert.equal(days.length, 7);
  assert.equal(days.at(-1)?.meals.length, 1);
  assert.equal(days[0].meals.length, 0);
});
