import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { dayBounds } from '../nutrition/engine';
import { fetchMealsForThirtyDays } from '../services/meals';
import type { Meal } from '../types/domain';

export function useNutritionData() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMeals(await fetchMealsForThirtyDays());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const { start, end } = dayBounds();
  const today = meals.filter((meal) => meal.eaten_at >= start && meal.eaten_at < end);
  return { meals, today, loading, error, refresh };
}
