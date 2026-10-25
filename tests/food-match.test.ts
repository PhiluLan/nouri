import assert from 'node:assert/strict';
import test from 'node:test';
import { isSuspiciousFoodMatch } from '../src/nutrition/food-match';

test('flags USDA foods that change the meaning of plain spaghetti', () => {
  assert.equal(isSuspiciousFoodMatch({ display_name: 'Spaghetti', fdc_description: 'Spaghetti, spinach, dry' }), true);
  assert.equal(isSuspiciousFoodMatch({ display_name: 'Spaghetti', fdc_description: 'Spaghetti squash, cooked' }), true);
  assert.equal(isSuspiciousFoodMatch({ display_name: 'Spaghetti', fdc_description: 'Spaghetti, cooked, unenriched' }), false);
});
