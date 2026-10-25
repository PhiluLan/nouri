import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { NutrientSummary } from '../../components/NutrientSummary';
import { Button, Card, EmptyState, Heading, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals, groupMealsByLocalDay } from '../../nutrition/engine';
import { referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function DayScreen() {
  const { profile } = useAuth();
  const { meals, today, loading, error, refresh } = useNutritionData();
  if (!profile) return null;
  const references = referencesFor(profile);
  const totals = aggregateMeals(today);
  const days = groupMealsByLocalDay(meals);
  const itemCount = today.reduce((sum, meal) => sum + (meal.meal_items?.length ?? 0), 0);
  const documented = totals.filter((item) => item.amount !== null).length;
  const maxMeals = Math.max(1, ...days.map((day) => day.meals.length));
  return <Screen refreshing={loading && meals.length > 0} onRefresh={() => void refresh()}>
    <AppTopBar />
    <Heading eyebrow="Dein Tagescheck" title={today.length ? 'So sieht heute aus' : 'Ein ruhiger Start'}>
      Schätzung deiner erfassten Zufuhr – nicht dein körperlicher Versorgungsstatus.
    </Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Alle dargestellten Mahlzeiten und Werte sind Testdaten.</Notice> : null}
    {loading && !meals.length ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Dein Tag wird geladen …</Text></View> : null}
    {error ? <Notice danger>{error}</Notice> : null}

    {!loading && !today.length ? <EmptyState symbol="＋" title="Noch nichts erfasst" action={<Button title="Erste Mahlzeit erfassen" onPress={() => router.push('/(tabs)/capture')} />}>
      Eine kurze Beschreibung genügt. nouri zerlegt sie in Lebensmittel und lässt dich alles prüfen.
    </EmptyState> : null}

    {today.length ? <>
      <Card tonal style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Heute erfasst</Text>
          <Text style={styles.heroValue}>{today.length} {today.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'}</Text>
          <Text style={styles.heroMeta}>{itemCount} Lebensmittel · {documented} von {references.length} Nährstoffbereichen dokumentiert</Text>
        </View>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeValue}>{documented}</Text><Text style={styles.heroBadgeLabel}>von {references.length}</Text></View>
      </Card>

      <SectionHeader title="Nährstoffe" meta="bis jetzt" />
      <NutrientSummary totals={totals} references={references} meals={meals} />
      <Text style={styles.helper}>„Mind.“ bedeutet: Mindestens dieser Wert ist dokumentiert; fehlende Daten wurden nicht als null ergänzt.</Text>
    </> : null}

    <SectionHeader title="Heutige Mahlzeiten" meta={today.length ? `${today.length} erfasst` : undefined} />
    {today.map((meal) => <Pressable key={meal.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })} style={({ pressed }) => pressed && styles.pressed}>
      <Card elevated style={styles.mealCard}>
        <View style={styles.mealTop}>
          <View style={styles.timeBadge}><Text style={styles.time}>{new Date(meal.eaten_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</Text></View>
          <Text style={styles.edit}>Prüfen ›</Text>
        </View>
        <Text style={styles.mealText} numberOfLines={2}>{meal.raw_text}</Text>
        <View style={styles.foodRow}>{meal.meal_items?.slice(0, 3).map((item) => <View key={item.id ?? item.display_name} style={styles.foodChip}><Text style={styles.foodChipText}>{item.display_name}</Text></View>)}</View>
      </Card>
    </Pressable>)}

    <SectionHeader title="7 Tage" meta="Erfassungsverlauf" />
    <Card style={styles.weekCard}>
      {days.map((day, index) => {
        const ratio = day.meals.length / maxMeals;
        const isToday = index === days.length - 1;
        return <View key={day.date} style={[styles.dayRow, index < days.length - 1 && styles.dayLine]}>
          <View style={styles.dayLabelWrap}>
            <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{isToday ? 'Heute' : new Date(`${day.date}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'short' })}</Text>
            <Text style={styles.dayDate}>{new Date(`${day.date}T12:00:00`).toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric' })}</Text>
          </View>
          <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${ratio * 100}%` }]} /></View>
          <Text style={styles.dayValue}>{day.meals.length || '–'}</Text>
        </View>;
      })}
      <Text style={styles.legend}>Der Balken zeigt nur, an wie vielen Mahlzeiten du etwas erfasst hast – keine Bewertung deiner Ernährung.</Text>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 14 },
  hero: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroEyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroValue: { color: colors.white, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.7 },
  heroMeta: { color: '#D7E5DF', fontSize: 13, lineHeight: 19 },
  heroBadge: { width: 72, height: 72, borderRadius: 26, backgroundColor: '#2B6453', alignItems: 'center', justifyContent: 'center' },
  heroBadgeValue: { color: colors.accent, fontSize: 26, fontWeight: '800', lineHeight: 29 },
  heroBadgeLabel: { color: colors.white, fontSize: 10, fontWeight: '700' },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: spacing.xs },
  mealCard: { borderRadius: radii.large },
  mealTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: { borderRadius: radii.pill, backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 5 },
  time: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  edit: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  mealText: { color: colors.ink, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  foodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foodChip: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 },
  foodChipText: { color: colors.inkSoft, fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  weekCard: { gap: 0 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52 },
  dayLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  dayLabelWrap: { width: 58 },
  dayName: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  dayNameToday: { color: colors.primary },
  dayDate: { color: colors.muted, fontSize: 10, marginTop: 2 },
  miniTrack: { flex: 1, height: 8, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  miniFill: { height: 8, backgroundColor: colors.accent, borderRadius: radii.pill },
  dayValue: { color: colors.inkSoft, width: 20, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  legend: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
});
