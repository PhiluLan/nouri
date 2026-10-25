import { nutrientLabel } from './references';
import type { NutrientKey, NutrientReference, NutrientTotal, Profile, Recommendation } from '../types/domain';

interface FoodCandidate {
  food: string;
  nutrients: NutrientKey[];
  excludes: string[];
}

const foods: FoodCandidate[] = [
  { food: 'Linsen', nutrients: ['iron', 'protein', 'folate', 'fiber'], excludes: [] },
  { food: 'Kichererbsen', nutrients: ['fiber', 'protein', 'folate', 'iron'], excludes: [] },
  { food: 'Rote Peperoni', nutrients: ['vitaminC'], excludes: [] },
  { food: 'Brokkoli', nutrients: ['vitaminC', 'folate', 'fiber'], excludes: [] },
  { food: 'Naturjoghurt', nutrients: ['calcium', 'protein', 'vitaminB12'], excludes: ['vegan', 'dairy_free', 'lactose_free'] },
  { food: 'Calcium-angereicherter Sojadrink', nutrients: ['calcium', 'protein'], excludes: ['soy_free'] },
  { food: 'Lachs', nutrients: ['protein', 'vitaminB12'], excludes: ['vegan', 'vegetarian', 'fish_free'] },
  { food: 'Ei', nutrients: ['protein', 'vitaminB12'], excludes: ['vegan', 'egg_free'] },
  { food: 'Kartoffeln', nutrients: ['potassium', 'vitaminC'], excludes: [] },
  { food: 'Weisse Bohnen', nutrients: ['potassium', 'fiber', 'iron', 'protein'], excludes: [] },
];

export function makeRecommendations(totals: NutrientTotal[], references: NutrientReference[], profile: Pick<Profile, 'diet' | 'allergies'>): Recommendation[] {
  const excluded = new Set([...profile.diet, ...profile.allergies]);
  const candidates = totals
    .map((total) => {
      const reference = references.find((item) => item.key === total.key);
      const coverage = total.totalItems ? total.knownItems / total.totalItems : 0;
      return { total, reference, coverage, ratio: reference && total.amount !== null ? total.amount / reference.target : 1 };
    })
    .filter((entry) => entry.reference && entry.total.amount !== null && entry.coverage >= 0.67 && entry.ratio < 0.8)
    .sort((a, b) => a.ratio - b.ratio);

  const usedFoods = new Set<string>();
  const result: Recommendation[] = [];
  for (const entry of candidates) {
    const option = foods.find((food) => food.nutrients.includes(entry.total.key) && !food.excludes.some((tag) => excluded.has(tag)) && !usedFoods.has(food.food));
    if (!option) continue;
    usedFoods.add(option.food);
    result.push({
      food: option.food,
      nutrient: entry.total.key,
      reason: `Passt zu deiner heute bislang niedrig erfassten Zufuhr von ${nutrientLabel(entry.total.key)}.`,
    });
    if (result.length === 3) break;
  }
  return result;
}
