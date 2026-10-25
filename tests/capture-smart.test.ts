import assert from 'node:assert/strict';
import test from 'node:test';
import { cloneMealItems, eatenAtForMoment, mealEmoji, smartMeals } from '../src/nutrition/capture-smart';
import type { Meal, MealItem } from '../src/types/domain';

const item = (name: string): MealItem => ({
  id: `item-${name}`,
  display_name: name,
  amount_g: 100,
  portion_label: 'eine Portion',
  quantity_confidence: 'high',
  match_confidence: 'high',
  fdc_id: 1,
  fdc_description: name,
  data_type: 'Foundation',
  nutrients_per_100g: { protein: 2 },
  nutrients_for_amount: { protein: 2 },
  missing_nutrients: [],
  source_url: null,
  notes: null,
});

const meal = (id: string, eatenAt: string, names: string[]): Meal => ({
  id,
  raw_text: names.join(' mit '),
  eaten_at: eatenAt,
  created_at: eatenAt,
  meal_items: names.map(item),
});

test('smartMeals groups recurring meals regardless of item order', () => {
  const result = smartMeals([
    meal('one', '2026-10-25T08:00:00.000Z', ['Kaffee', 'Milch']),
    meal('two', '2026-10-24T08:00:00.000Z', ['Milch', 'Kaffee']),
    meal('three', '2026-10-25T12:00:00.000Z', ['Linsen']),
  ]);
  assert.equal(result[0].id, 'one');
  assert.equal(result[0].occurrences, 2);
});

test('cloneMealItems removes database ids and copies nutrient data', () => {
  const original = item('Banane');
  const clone = cloneMealItems([original])[0];
  assert.equal(clone.id, undefined);
  assert.notEqual(clone.nutrients_per_100g, original.nutrients_per_100g);
  assert.deepEqual(clone.nutrients_per_100g, original.nutrients_per_100g);
});

test('eatenAtForMoment uses selected local time and mealEmoji recognizes coffee', () => {
  const date = new Date('2026-10-25T15:35:00+01:00');
  const breakfast = new Date(eatenAtForMoment('breakfast', date));
  assert.equal(breakfast.getHours(), 8);
  assert.equal(mealEmoji('Kaffee mit Milch'), '☕️');
});
