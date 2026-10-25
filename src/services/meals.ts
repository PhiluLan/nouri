import { supabase } from '../lib/supabase';
import { dayBounds, historyStart } from '../nutrition/engine';
import { deletePreviewMeal, getPreviewMeal, getPreviewMeals, isPreviewMode, previewAnalyzeMeal, savePreviewMeal } from '../lib/preview';
import type { Meal, MealItem, ParsedMeal } from '../types/domain';

export async function analyzeMeal(rawText: string): Promise<ParsedMeal> {
  if (isPreviewMode) return previewAnalyzeMeal(rawText);
  const { data, error } = await supabase.functions.invoke('analyze-meal', { body: { text: rawText } });
  if (error) throw new Error(error.message || 'Die Mahlzeit konnte nicht analysiert werden.');
  if (!data?.items?.length) throw new Error('Es wurden keine Lebensmittel erkannt. Bitte formuliere die Eingabe genauer.');
  return data as ParsedMeal;
}

export async function saveMeal(input: { mealId?: string; rawText: string; eatenAt: string; items: MealItem[] }): Promise<string> {
  if (isPreviewMode) return savePreviewMeal(input);
  const { data, error } = await supabase.rpc('save_meal', {
    p_meal_id: input.mealId ?? null,
    p_raw_text: input.rawText,
    p_eaten_at: input.eatenAt,
    p_items: input.items,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchMealsForToday(date = new Date()): Promise<Meal[]> {
  if (isPreviewMode) {
    const { start, end } = dayBounds(date);
    return getPreviewMeals().filter((meal) => meal.eaten_at >= start && meal.eaten_at < end);
  }
  const { start, end } = dayBounds(date);
  return fetchMeals(start, end);
}

export async function fetchMealsForThirtyDays(now = new Date()): Promise<Meal[]> {
  if (isPreviewMode) return getPreviewMeals();
  return fetchMeals(historyStart(30, now), new Date(now.getTime() + 60_000).toISOString());
}

export async function fetchMeal(id: string): Promise<Meal> {
  if (isPreviewMode) return getPreviewMeal(id);
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Meal;
}

export async function deleteMeal(id: string): Promise<void> {
  if (isPreviewMode) {
    deletePreviewMeal(id);
    return;
  }
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}

async function fetchMeals(start: string, end: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .gte('eaten_at', start)
    .lt('eaten_at', end)
    .order('eaten_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Meal[];
}
