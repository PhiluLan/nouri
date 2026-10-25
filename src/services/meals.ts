import { supabase } from '../lib/supabase';
import { dayBounds, historyStart } from '../nutrition/engine';
import { deletePreviewMeal, deletePreviewMealTemplate, getPreviewMeal, getPreviewMeals, getPreviewMealTemplates, isPreviewMode, markPreviewMealTemplateUsed, previewAnalyzeMeal, savePreviewMeal, savePreviewMealTemplate } from '../lib/preview';
import type { Meal, MealItem, MealTemplate, ParsedMeal } from '../types/domain';

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

export async function fetchMealTemplates(): Promise<MealTemplate[]> {
  if (isPreviewMode) return getPreviewMealTemplates();
  const { data, error } = await supabase
    .from('meal_templates')
    .select('id, name, raw_text, items, usage_count, last_used_at, created_at, updated_at')
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MealTemplate[];
}

export async function createMealTemplate(input: { name: string; rawText: string; items: MealItem[] }): Promise<MealTemplate> {
  if (isPreviewMode) return savePreviewMealTemplate(input);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error('Bitte melde dich erneut an.');
  const { data, error } = await supabase
    .from('meal_templates')
    .upsert({
      user_id: userData.user.id,
      name: input.name.trim(),
      raw_text: input.rawText,
      items: input.items,
    }, { onConflict: 'user_id,name' })
    .select('id, name, raw_text, items, usage_count, last_used_at, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as MealTemplate;
}

export async function markMealTemplateUsed(template: MealTemplate): Promise<void> {
  if (isPreviewMode) return markPreviewMealTemplateUsed(template.id);
  const { error } = await supabase
    .from('meal_templates')
    .update({ usage_count: template.usage_count + 1, last_used_at: new Date().toISOString() })
    .eq('id', template.id);
  if (error) throw error;
}

export async function deleteMealTemplate(id: string): Promise<void> {
  if (isPreviewMode) return deletePreviewMealTemplate(id);
  const { error } = await supabase.from('meal_templates').delete().eq('id', id);
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
