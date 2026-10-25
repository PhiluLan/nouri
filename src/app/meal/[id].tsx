import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MealEditor, mealItemsAreSavable } from '../../components/MealEditor';
import { Button, Heading, Notice, Screen } from '../../components/ui';
import { colors } from '../../components/theme';
import { deleteMeal, fetchMeal, saveMeal } from '../../services/meals';
import type { Meal, MealItem } from '../../types/domain';

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (id) fetchMeal(id).then((data) => { setMeal(data); setItems(data.meal_items); }).catch((error) => Alert.alert('Laden fehlgeschlagen', error.message)); }, [id]);

  async function save() {
    if (!meal || !mealItemsAreSavable(items)) return;
    setBusy(true);
    try {
      await saveMeal({ mealId: meal.id, rawText: meal.raw_text, eatenAt: meal.eaten_at, items });
      router.back();
    } catch (error) {
      Alert.alert('Speichern fehlgeschlagen', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally { setBusy(false); }
  }

  function confirmDelete() {
    if (!meal) return;
    Alert.alert('Mahlzeit löschen?', 'Die erfassten Werte werden aus dem Tagescheck entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteMeal(meal.id); router.back(); } },
    ]);
  }

  if (!meal) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  return <Screen>
    <Heading eyebrow="Bearbeiten" title="Mahlzeit prüfen">Änderungen an Namen müssen erneut mit FoodData Central abgeglichen werden.</Heading>
    <Notice warning>{meal.raw_text}</Notice>
    <MealEditor items={items} onChange={setItems} />
    <Button title="Änderungen speichern" onPress={save} loading={busy} disabled={!mealItemsAreSavable(items)} />
    <Button secondary title="Mahlzeit löschen" onPress={confirmDelete} />
    <Text style={styles.cancel} onPress={() => router.back()}>Abbrechen</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  cancel: { color: colors.muted, textAlign: 'center', padding: 12, fontWeight: '600' },
});
