import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/20261025173319_initial_nouri_schema.sql', import.meta.url);
const edgePath = new URL('../supabase/functions/analyze-meal/index.ts', import.meta.url);
const migration = readFileSync(migrationPath, 'utf8');
const edge = readFileSync(edgePath, 'utf8');

test('every exposed user-data table enables RLS and has ownership policies', () => {
  for (const table of ['profiles', 'meals', 'meal_items']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(migration, new RegExp(`create policy ${table}.*select.*to authenticated`, 'is'));
  }
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
});

test('meal persistence is invoker-secured and recalculates nutrients in Postgres', () => {
  assert.match(migration, /function public\.save_meal[\s\S]*security invoker/i);
  assert.match(migration, /jsonb_object_agg[\s\S]*nutrient\.value[\s\S]*item->>'amount_g'/i);
  assert.match(migration, /revoke all on function public\.save_meal[\s\S]*from public, anon/i);
});

test('edge function requires user auth and keeps source APIs server-side', () => {
  assert.match(edge, /withSupabase\(\{ auth: 'user' \}/);
  assert.match(edge, /Deno\.env\.get\('OPENAI_API_KEY'\)/);
  assert.match(edge, /Deno\.env\.get\('USDA_API_KEY'\)/);
  assert.match(edge, /api\.nal\.usda\.gov\/fdc\/v1\/food/);
  assert.match(edge, /type: 'json_schema'/);
});
