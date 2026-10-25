import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateNouriHealth } from '../src/nutrition/nouri-health';
import { referencesFor } from '../src/nutrition/references';
import type { Meal, MealItem, NutrientMap, Profile } from '../src/types/domain';

const profile: Profile = {
  id: 'user', birth_year: 1990, sex: 'female', weight_kg: 60, pregnant: false, breastfeeding: false,
  life_stage: 'none', menopause_status: 'pre', phytate_level: 'medium', reference_profile_version: 2,
  diet: [], allergies: [], reference_source: 'BLV', reference_version: '2026', onboarded_at: '2026-01-01T00:00:00Z',
};

function meal(id: string, eatenAt: string, foods: { name: string; nutrients: NutrientMap }[]): Meal {
  return {
    id, raw_text: foods.map((food) => food.name).join(' und '), eaten_at: eatenAt, created_at: eatenAt,
    meal_items: foods.map((food, index): MealItem => ({
      id: `${id}-${index}`, display_name: food.name, amount_g: 100, portion_label: '100 g',
      quantity_confidence: 'high', match_confidence: 'high', fdc_id: index + 1,
      fdc_description: food.name, data_type: 'Foundation', nutrients_per_100g: food.nutrients,
      nutrients_for_amount: food.nutrients, missing_nutrients: [], source_url: null, notes: null,
    })),
  };
}

test('nouri health rewards logged rhythm and variety without claiming a body status', () => {
  const now = new Date('2026-10-25T12:00:00+01:00');
  const meals = [
    meal('today', '2026-10-25T08:00:00+01:00', [
      { name: 'Linsen', nutrients: { protein: 30, fiber: 20, iron: 8 } },
      { name: 'Peperoni', nutrients: { vitaminC: 100, folate: 200, potassium: 500 } },
    ]),
    meal('yesterday', '2026-10-24T12:00:00+02:00', [
      { name: 'Hafer', nutrients: { protein: 20, fiber: 12, iron: 4 } },
      { name: 'Banane', nutrients: { vitaminC: 30, folate: 100, potassium: 800 } },
    ]),
  ];
  const health = calculateNouriHealth(meals, referencesFor(profile, 2026), now);
  assert.equal(health.activeDays, 2);
  assert.equal(health.streak, 2);
  assert.equal(health.uniqueFoods, 4);
  assert.ok(health.score !== null && health.score > 0);
});

test('nouri health excludes insufficiently documented nutrient signals instead of treating them as zero', () => {
  const now = new Date('2026-10-25T12:00:00+01:00');
  const meals = [meal('today', '2026-10-25T08:00:00+01:00', [
    { name: 'Dokumentiert', nutrients: { protein: 20 } },
    { name: 'Unbekannt', nutrients: {} },
  ])];
  const health = calculateNouriHealth(meals, referencesFor(profile, 2026), now);
  assert.equal(health.nutrientBalance, null);
  assert.equal(health.documentedSignals, 0);
  assert.ok(health.score !== null);
});

test('a current streak is preserved before the user has logged today', () => {
  const now = new Date('2026-10-25T12:00:00+01:00');
  const meals = [
    meal('yesterday', '2026-10-24T12:00:00+02:00', [{ name: 'Apfel', nutrients: { fiber: 3 } }]),
    meal('before', '2026-10-23T12:00:00+02:00', [{ name: 'Birne', nutrients: { fiber: 4 } }]),
  ];
  const health = calculateNouriHealth(meals, referencesFor(profile, 2026), now);
  assert.equal(health.streak, 2);
  assert.equal(health.todayFoods, 0);
});
