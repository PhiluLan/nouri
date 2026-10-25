import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MealEditor, mealItemsAreSavable } from '../../components/MealEditor';
import { Button, Card, Heading, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Speichern fehlgeschlagen', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally { setBusy(false); }
  }

  function confirmDelete() {
    if (!meal) return;
    Alert.alert('Mahlzeit löschen?', 'Die erfassten Werte werden aus dem Tagescheck entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          await deleteMeal(meal.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        } catch (error) {
          Alert.alert('Löschen fehlgeschlagen', error instanceof Error ? error.message : 'Unbekannter Fehler');
        } finally { setBusy(false); }
      } },
    ]);
  }

  if (!meal) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  return <Screen>
    <View style={styles.topBar}>
      <Text style={styles.topTitle}>Mahlzeit</Text>
      <Text accessibilityRole="button" style={styles.close} onPress={() => router.back()}>Fertig</Text>
    </View>
    <Heading eyebrow="Prüfen & bearbeiten" title="Stimmt alles?">Mengen werden sofort neu berechnet. Geänderte Lebensmittel gleichen wir erneut mit FoodData Central ab.</Heading>
    <Card tonal>
      <Text style={styles.originalLabel}>Ursprüngliche Eingabe</Text>
      <Text style={styles.original}>{meal.raw_text}</Text>
      <Text style={styles.timestamp}>{new Date(meal.eaten_at).toLocaleString('de-CH', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
    </Card>
    <SectionHeader title="Lebensmittel" meta={`${items.length} ${items.length === 1 ? 'Position' : 'Positionen'}`} />
    <MealEditor items={items} onChange={setItems} />
    <Button title="Änderungen speichern" onPress={save} loading={busy} disabled={!mealItemsAreSavable(items)} />
    <Button danger title="Mahlzeit löschen" onPress={confirmDelete} disabled={busy} />
    <Notice>Die Nährstoffwerte beschreiben eine geschätzte Zufuhr anhand der erfassten Mengen, nicht deinen körperlichen Versorgungsstatus.</Notice>
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  close: { color: colors.primary, backgroundColor: colors.primarySoft, overflow: 'hidden', borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13, fontWeight: '800' },
  originalLabel: { color: colors.primary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800' },
  original: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  timestamp: { color: colors.muted, fontSize: 11, marginTop: spacing.xs },
});
