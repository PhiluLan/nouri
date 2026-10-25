export interface UsdaSearchCandidate {
  description: string;
  dataType: string;
}

const preparationWords = new Set([
  'and', 'cooked', 'dry', 'fresh', 'frozen', 'plain', 'raw', 'ready',
  'rolled', 'unsalted', 'whole', 'with', 'without',
]);

const conflictingCategories: Record<string, Set<string>> = {
  banana: new Set(['pepper', 'peppers']),
  milk: new Set(['cheese', 'dessert', 'yogurt']),
  pasta: new Set(['squash', 'spinach']),
  spaghetti: new Set(['squash', 'spinach']),
};

export function scoreUsdaFood(food: UsdaSearchCandidate, query: string, index: number): number {
  const queryWords = normalizedWords(query);
  const descriptionWords = normalizedWords(food.description);
  const primaryFood = queryWords.find((word) => !preparationWords.has(word)) ?? queryWords[0];
  const primaryPosition = primaryFood ? descriptionWords.indexOf(primaryFood) : -1;
  const relevanceScore = Math.max(0, 24 - index * 3);
  const primaryScore = primaryPosition === 0 ? 40 : primaryPosition > 0 ? 8 : -40;
  const overlapScore = wordOverlap(food.description, query) * 12;
  const dataTypeScore: Record<string, number> = { Foundation: 3, 'SR Legacy': 2, 'Survey (FNDDS)': 1 };
  const conflictPenalty = hasCategoryConflict(primaryFood, queryWords, descriptionWords) ? 60 : 0;

  return relevanceScore + primaryScore + overlapScore + (dataTypeScore[food.dataType] ?? 0) - conflictPenalty;
}

export function matchConfidence(description: string, query: string): 'high' | 'medium' | 'low' {
  const queryWords = normalizedWords(query);
  const descriptionWords = normalizedWords(description);
  const primaryFood = queryWords.find((word) => !preparationWords.has(word)) ?? queryWords[0];
  const primaryPosition = primaryFood ? descriptionWords.indexOf(primaryFood) : -1;
  const overlap = wordOverlap(description, query);

  if (hasCategoryConflict(primaryFood, queryWords, descriptionWords)) return 'low';
  if (primaryPosition === 0 && overlap >= 0.5) return 'high';
  if (primaryPosition >= 0 && overlap >= 0.5) return 'medium';
  return 'low';
}

function hasCategoryConflict(primaryFood: string | undefined, queryWords: string[], descriptionWords: string[]): boolean {
  if (!primaryFood) return false;
  const conflicts = conflictingCategories[primaryFood];
  return Boolean(conflicts && descriptionWords.some((word) => conflicts.has(word) && !queryWords.includes(word)));
}

export function wordOverlap(description: string, query: string): number {
  const queryWords = [...new Set(normalizedWords(query))];
  const descriptionWords = new Set(normalizedWords(description));
  return queryWords.length ? queryWords.filter((word) => descriptionWords.has(word)).length / queryWords.length : 0;
}

function normalizedWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map(singularize);
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  return word;
}
