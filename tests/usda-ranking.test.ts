import assert from 'node:assert/strict';
import test from 'node:test';
import { matchConfidence, scoreUsdaFood } from '../supabase/functions/analyze-meal/_shared/usda-ranking';

test('ranks a raw banana above banana peppers', () => {
  const banana = { description: 'Bananas, raw', dataType: 'SR Legacy' };
  const pepper = { description: 'Peppers, banana or Hungarian wax, seeded, raw', dataType: 'Foundation' };

  assert.ok(scoreUsdaFood(banana, 'banana raw', 3) > scoreUsdaFood(pepper, 'banana raw', 0));
  assert.equal(matchConfidence(banana.description, 'banana raw'), 'high');
  assert.equal(matchConfidence(pepper.description, 'banana raw'), 'low');
});

test('ranks whole milk above ricotta made from whole milk', () => {
  const milk = { description: 'Milk, whole, 3.25% milkfat, with added vitamin D', dataType: 'SR Legacy' };
  const ricotta = { description: 'Cheese, ricotta, whole milk', dataType: 'Foundation' };

  assert.ok(scoreUsdaFood(milk, 'whole milk', 3) > scoreUsdaFood(ricotta, 'whole milk', 0));
  assert.equal(matchConfidence(milk.description, 'whole milk'), 'high');
});

test('keeps the USDA result order relevant without preferring a derivative food', () => {
  const oats = { description: 'Oats, whole grain, rolled, old fashioned', dataType: 'Foundation' };
  const snack = { description: 'Snacks, granola bars, oats, fruits and nuts', dataType: 'Survey (FNDDS)' };

  assert.ok(scoreUsdaFood(oats, 'rolled oats dry', 2) > scoreUsdaFood(snack, 'rolled oats dry', 0));
});

test('rejects spinach pasta and spaghetti squash for plain spaghetti', () => {
  const plain = { description: 'Spaghetti, cooked, unenriched, without added salt', dataType: 'SR Legacy' };
  const spinach = { description: 'Spaghetti, spinach, dry', dataType: 'SR Legacy' };
  const squash = { description: 'Spaghetti squash, cooked', dataType: 'Survey (FNDDS)' };

  assert.ok(scoreUsdaFood(plain, 'spaghetti cooked', 4) > scoreUsdaFood(spinach, 'spaghetti cooked', 0));
  assert.ok(scoreUsdaFood(plain, 'spaghetti cooked', 4) > scoreUsdaFood(squash, 'spaghetti cooked', 0));
  assert.equal(matchConfidence(spinach.description, 'spaghetti dry'), 'low');
  assert.equal(matchConfidence(squash.description, 'spaghetti cooked'), 'low');
});
