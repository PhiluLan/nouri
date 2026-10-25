import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NutrientSummary } from '../../components/NutrientSummary';
import { Card, Heading, Notice, Screen, textStyles } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals, groupMealsByLocalDay } from '../../nutrition/engine';
import { referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function DayScreen() {
  const { profile } = useAuth();
  const { meals, today, loading, error } = useNutritionData();
  if (!profile) return null;
  const references = referencesFor(profile);
  const totals = aggregateMeals(today);
  const days = groupMealsByLocalDay(meals);

  return <Screen>
    <Heading eyebrow="Tagescheck" title="Heute, auf einen Blick">Erfasste Zufuhr im Verhältnis zu deinen Referenzwerten – nicht dein körperlicher Versorgungsstatus.</Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Alle dargestellten Mahlzeiten und Werte sind Testdaten.</Notice> : null}
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Notice warning>{error}</Notice> : null}
    {!loading && !today.length ? <Notice>Heute ist noch keine Mahlzeit erfasst. Beginne im Tab „Erfassen“.</Notice> : <NutrientSummary totals={totals} references={references} />}

    <Text style={styles.sectionTitle}>Heutige Mahlzeiten</Text>
    {today.map((meal) => <Pressable key={meal.id} onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })}>
      <Card style={styles.mealCard}>
        <View style={styles.mealTime}><Text style={styles.time}>{new Date(meal.eaten_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</Text><Text style={styles.edit}>Bearbeiten ›</Text></View>
        <Text style={textStyles.body} numberOfLines={2}>{meal.raw_text}</Text>
        <Text style={textStyles.muted}>{meal.meal_items?.length ?? 0} Lebensmittel</Text>
      </Card>
    </Pressable>)}

    <Text style={styles.sectionTitle}>Letzte 7 Tage</Text>
    <Card>
      {days.map((day, index) => {
        const dayTotals = day.totals.filter((item) => item.amount !== null);
        const avg = dayTotals.length ? dayTotals.reduce((sum, total) => {
          const ref = references.find((item) => item.key === total.key);
          return sum + Math.min((total.amount ?? 0) / (ref?.target ?? 1), 1);
        }, 0) / dayTotals.length : 0;
        return <View key={day.date} style={[styles.dayRow, index < days.length - 1 && styles.dayLine]}>
          <Text style={styles.dayName}>{new Date(`${day.date}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'short' })}</Text>
          <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${avg * 100}%` }]} /></View>
          <Text style={styles.dayValue}>{day.meals.length ? `${day.meals.length} Mahlz.` : '–'}</Text>
        </View>;
      })}
      <Text style={styles.legend}>Balken = durchschnittlicher Anteil der dokumentierten Referenzwerte; fehlende Werte werden nicht als null gerechnet.</Text>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: spacing.sm },
  mealCard: { borderRadius: radii.medium },
  mealTime: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  edit: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 38 },
  dayLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  dayName: { color: colors.ink, width: 34, fontWeight: '600' },
  miniTrack: { flex: 1, height: 7, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  miniFill: { height: 7, backgroundColor: colors.primary },
  dayValue: { color: colors.muted, width: 68, textAlign: 'right', fontSize: 12 },
  legend: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.xs },
});
