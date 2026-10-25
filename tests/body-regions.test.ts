import assert from 'node:assert/strict';
import test from 'node:test';
import { bodyRegions } from '../src/nutrition/body-regions';
import { NUTRIENT_KEYS } from '../src/types/domain';

test('body landscape exposes distinct regions with valid nutrient relationships', () => {
  assert.equal(bodyRegions.length, 9);
  assert.equal(new Set(bodyRegions.map((region) => region.key)).size, bodyRegions.length);
  for (const region of bodyRegions) {
    assert.ok(region.nutrients.length >= 4);
    assert.ok(region.functions.length >= 3);
    assert.ok(region.nutrients.every((key) => NUTRIENT_KEYS.includes(key)));
  }
});
