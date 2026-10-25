import type { MealItem } from '../types/domain';

const conflicts: { input: RegExp; source: RegExp }[] = [
  { input: /\bspaghetti\b/i, source: /\b(spaghetti squash|spinach)\b/i },
  { input: /\bbanan(e|a)\b/i, source: /\bbanana peppers?\b/i },
];

export function isSuspiciousFoodMatch(item: Pick<MealItem, 'display_name' | 'fdc_description'>): boolean {
  if (!item.fdc_description) return false;
  return conflicts.some(({ input, source }) => input.test(item.display_name) && source.test(item.fdc_description ?? ''));
}
