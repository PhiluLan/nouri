import { aggregateMeals, groupMealsByLocalDay, localDateKey } from './engine';
import type { Meal, NutrientKey, NutrientReference } from '../types/domain';

export const NOURI_FEATURED_KEYS: NutrientKey[] = [
  'protein', 'fiber', 'epaDha', 'folate', 'vitaminB12',
  'vitaminC', 'vitaminD', 'calcium', 'iron', 'potassium',
];

export type NouriMood = 'new' | 'curious' | 'happy' | 'radiant';

export interface NouriHealthSnapshot {
  score: number | null;
  mood: NouriMood;
  moodLabel: string;
  message: string;
  streak: number;
  activeDays: number;
  uniqueFoods: number;
  todayFoods: number;
  nutrientBalance: number | null;
  documentedSignals: number;
  strengths: NutrientKey[];
  nextNutrient: NutrientKey | null;
  rhythm: number;
  variety: number;
  week: { date: string; active: boolean; today: boolean }[];
}

/** A motivational game value derived from logged meals, never a health or deficiency assessment. */
export function calculateNouriHealth(meals: Meal[], references: NutrientReference[], now = new Date()): NouriHealthSnapshot {
  const days = groupMealsByLocalDay(meals, 7, now);
  const weekMeals = days.flatMap((day) => day.meals);
  const activeDays = days.filter((day) => day.meals.length > 0).length;
  const todayKey = localDateKey(now);
  const todayMeals = days.find((day) => day.date === todayKey)?.meals ?? [];
  const foods = uniqueFoodNames(weekMeals);
  const todayFoods = uniqueFoodNames(todayMeals).length;
  const rhythm = Math.round(Math.min(activeDays / 5, 1) * 100);
  const variety = Math.round(Math.min(foods.length / 12, 1) * 100);
  const signals = nutrientSignals(weekMeals, references, Math.max(activeDays, 1));
  const nutrientBalance = signals.length
    ? Math.round(signals.reduce((sum, signal) => sum + Math.min(signal.ratio, 1), 0) / signals.length * 100)
    : null;

  const score = weekMeals.length === 0 ? null : weightedScore([
    { value: rhythm, weight: 0.3 },
    { value: variety, weight: 0.3 },
    ...(nutrientBalance === null ? [] : [{ value: nutrientBalance, weight: 0.4 }]),
  ]);
  const mood = moodFor(score);
  const sortedSignals = [...signals].sort((a, b) => b.ratio - a.ratio);
  const next = [...signals].sort((a, b) => a.ratio - b.ratio)[0];

  return {
    score,
    mood,
    moodLabel: moodCopy[mood].label,
    message: moodCopy[mood].message,
    streak: caringStreak(days, now),
    activeDays,
    uniqueFoods: foods.length,
    todayFoods,
    nutrientBalance,
    documentedSignals: signals.length,
    strengths: sortedSignals.filter((signal) => signal.ratio >= 0.8).slice(0, 3).map((signal) => signal.key),
    nextNutrient: next?.key ?? null,
    rhythm,
    variety,
    week: days.map((day) => ({ date: day.date, active: day.meals.length > 0, today: day.date === todayKey })),
  };
}

function nutrientSignals(meals: Meal[], references: NutrientReference[], activeDays: number) {
  const totals = aggregateMeals(meals);
  return NOURI_FEATURED_KEYS.flatMap((key) => {
    const total = totals.find((entry) => entry.key === key);
    const reference = references.find((entry) => entry.key === key);
    if (!total || !reference || total.amount === null || total.totalItems === 0) return [];
    if (total.knownItems / total.totalItems < 0.67) return [];
    return [{ key, ratio: total.amount / (reference.target * activeDays) }];
  });
}

function uniqueFoodNames(meals: Meal[]) {
  return [...new Set(meals.flatMap((meal) => meal.meal_items ?? [])
    .map((item) => item.display_name.trim().toLocaleLowerCase('de-CH'))
    .filter(Boolean))];
}

function caringStreak(days: ReturnType<typeof groupMealsByLocalDay>, now: Date) {
  let index = days.length - 1;
  const todayHasMeals = Boolean(days[index]?.meals.length);
  if (!todayHasMeals && now.getHours() < 23) index -= 1;
  let streak = 0;
  for (; index >= 0 && days[index].meals.length > 0; index -= 1) streak += 1;
  return streak;
}

function weightedScore(parts: { value: number; weight: number }[]) {
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  return Math.round(parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weight);
}

function moodFor(score: number | null): NouriMood {
  if (score === null) return 'new';
  if (score >= 78) return 'radiant';
  if (score >= 55) return 'happy';
  return 'curious';
}

const moodCopy: Record<NouriMood, { label: string; message: string }> = {
  new: { label: 'Neugierig', message: 'Ich bin bereit, deine Essenswelt kennenzulernen.' },
  curious: { label: 'Auf Entdeckung', message: 'Ich sammle noch Farben für meinen kleinen Garten.' },
  happy: { label: 'Zufrieden', message: 'Das fühlt sich schon schön abwechslungsreich an.' },
  radiant: { label: 'Strahlt', message: 'Schau mal, wie mein Bauchlicht leuchtet!' },
};
