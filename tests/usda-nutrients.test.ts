import assert from 'node:assert/strict';
import test from 'node:test';
import { desiredUnits, extractNutrients } from '../supabase/functions/analyze-meal/_shared/usda-nutrients';

const nutrient = (number: string, amount: number, unitName: string) => ({ amount, nutrient: { number, unitName } });

test('extracts documented USDA nutrients and converts them into reference units', () => {
  const result = extractNutrients([
    nutrient('203', 12.34, 'G'),
    nutrient('313', 25, 'UG'),
    nutrient('621', 0.08, 'G'),
    nutrient('629', 0.12, 'G'),
  ]);
  assert.equal(result.protein, 12.34);
  assert.equal(result.fluoride, 0.025);
  assert.equal(result.dha, 80);
  assert.equal(result.epaDha, 200);
  assert.equal(result.iron, undefined);
});

test('does not invent a composite EPA+DHA value when either component is missing', () => {
  const result = extractNutrients([nutrient('621', 0.08, 'G')]);
  assert.equal(result.dha, 80);
  assert.equal(result.epaDha, undefined);
  assert.equal(Object.keys(desiredUnits).length, 34);
});
