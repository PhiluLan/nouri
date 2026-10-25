import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { contributionCoverage, contributionsFor, groupContributionsByIngredient, type ContributionPeriod, type NutrientContribution } from '../nutrition/contributions';
import type { Meal, NutrientReference } from '../types/domain';
import { colors, radii, spacing } from './theme';

const periods: { key: ContributionPeriod; label: string; description: string }[] = [
  { key: 'day', label: 'Heute', description: 'heute' },
  { key: 'week', label: '7 Tage', description: 'in 7 Tagen' },
  { key: 'month', label: '30 Tage', description: 'in 30 Tagen' },
];

export function NutrientSourcesModal({ reference, meals, onClose }: { reference: NutrientReference | null; meals: Meal[]; onClose: () => void }) {
  const [period, setPeriod] = useState<ContributionPeriod>('day');
  const contributions = useMemo(() => reference ? contributionsFor(meals, reference.key, period) : [], [meals, period, reference]);
  const ingredients = useMemo(() => groupContributionsByIngredient(contributions), [contributions]);
  if (!reference) return null;
  const coverage = contributionCoverage(meals, reference.key, period);
  const total = ingredients.reduce((sum, item) => sum + item.amount, 0);
  const mealGroups = groupByMeal(contributions);
  const periodCopy = periods.find((item) => item.key === period)?.description ?? '';

  return <Modal visible animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="Aufschlüsselung schliessen" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.eyebrow}>Woher kommt dein Wert?</Text><Text style={styles.title}>{reference.label}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Schliessen" hitSlop={10} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <View style={styles.tabs}>{periods.map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: period === item.key }} onPress={() => setPeriod(item.key)} style={[styles.tab, period === item.key && styles.tabActive]}><Text style={[styles.tabText, period === item.key && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Aus deinen erfassten Lebensmitteln</Text>
            <Text style={styles.totalValue}>{total ? format(total) : '–'} <Text style={styles.totalUnit}>{reference.unit}</Text></Text>
            <Text style={styles.totalMeta}>{total ? `${ingredients.length} ${ingredients.length === 1 ? 'Zutat' : 'Zutaten'} ${periodCopy}` : `Noch kein dokumentierter Wert ${periodCopy}`}</Text>
          </View>

          {ingredients.length ? <>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Nach Zutaten</Text><Text style={styles.sectionMeta}>grösster Beitrag zuerst</Text></View>
            <View style={styles.card}>{ingredients.map((item, index) => {
              const ratio = total ? item.amount / total : 0;
              return <View key={item.ingredient.toLocaleLowerCase('de-CH')} style={[styles.ingredient, index < ingredients.length - 1 && styles.divider]}>
                <View style={styles.ingredientTop}><Text style={styles.ingredientName}>{item.ingredient}</Text><Text style={styles.ingredientAmount}>{format(item.amount)} {reference.unit}</Text></View>
                <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(2, ratio * 100)}%` }]} /></View>
                <Text style={styles.ingredientMeta}>{Math.round(ratio * 100)} % dieses Werts · aus {item.mealCount} {item.mealCount === 1 ? 'Mahlzeit' : 'Mahlzeiten'}</Text>
              </View>;
            })}</View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Nach Mahlzeiten</Text><Text style={styles.sectionMeta}>{mealGroups.length} erfasst</Text></View>
            {mealGroups.map((meal) => <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}><Text style={styles.mealDate}>{formatDate(meal.eatenAt)}</Text><Text style={styles.mealTotal}>{format(meal.total)} {reference.unit}</Text></View>
              <Text style={styles.mealTitle} numberOfLines={2}>{meal.text}</Text>
              {meal.items.map((item) => <View key={`${meal.id}-${item.ingredient}`} style={styles.mealItem}><Text style={styles.mealItemName}>{item.ingredient}</Text><Text style={styles.mealItemAmount}>+ {format(item.amount)} {reference.unit}</Text></View>)}
            </View>)}
          </> : <View style={styles.empty}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↳</Text></View>
            <Text style={styles.emptyTitle}>Noch nichts aufzuschlüsseln</Text>
            <Text style={styles.emptyText}>Für {reference.label} ist in diesem Zeitraum kein Wert aus deinen erfassten Lebensmitteln dokumentiert.</Text>
          </View>}

          {coverage.total > 0 && coverage.known < coverage.total ? <View style={styles.notice}><Text style={styles.noticeIcon}>i</Text><Text style={styles.noticeText}>Diese Summe enthält {coverage.known} von {coverage.total} Zutaten. Bei den übrigen fehlen Werte in der Datenquelle – sie werden nicht als null gerechnet.</Text></View> : null}
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Fertig</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function groupByMeal(contributions: NutrientContribution[]) {
  const groups = new Map<string, { id: string; text: string; eatenAt: string; total: number; items: { ingredient: string; amount: number }[] }>();
  for (const contribution of contributions) {
    const current = groups.get(contribution.mealId) ?? { id: contribution.mealId, text: contribution.mealText, eatenAt: contribution.eatenAt, total: 0, items: [] };
    current.total += contribution.amount;
    current.items.push({ ingredient: contribution.ingredient, amount: contribution.amount });
    groups.set(contribution.mealId, current);
  }
  return [...groups.values()].map((group) => ({ ...group, total: round(group.total), items: group.items.sort((a, b) => b.amount - a.amount) })).sort((a, b) => b.eatenAt.localeCompare(a.eatenAt));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' });
}

function format(value: number) {
  return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(2)).toLocaleString('de-CH');
}

function round(value: number) { return Math.round(value * 100) / 100; }

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 38, 31, 0.42)' },
  sheet: { maxHeight: '93%', backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, alignSelf: 'center', marginTop: 10 },
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 36, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.primary, fontSize: 27, lineHeight: 30 },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: colors.primarySoft, borderRadius: radii.pill },
  tab: { flex: 1, minHeight: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.surfaceRaised },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  totalCard: { backgroundColor: colors.primary, borderRadius: radii.large, padding: spacing.lg, gap: 3 },
  totalLabel: { color: '#D7E5DF', fontSize: 11, fontWeight: '700' },
  totalValue: { color: colors.white, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 },
  totalUnit: { color: colors.accent, fontSize: 18 },
  totalMeta: { color: '#D7E5DF', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.xs },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 10 },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: radii.large, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  ingredient: { paddingVertical: 14, gap: 7 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  ingredientTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
  ingredientName: { color: colors.ink, fontSize: 14, fontWeight: '800', flex: 1 },
  ingredientAmount: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  track: { height: 7, borderRadius: radii.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.accent },
  ingredientMeta: { color: colors.muted, fontSize: 10 },
  mealCard: { backgroundColor: colors.surfaceRaised, borderRadius: radii.medium, padding: spacing.md, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  mealDate: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  mealTotal: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  mealTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  mealItemName: { color: colors.inkSoft, fontSize: 12, flex: 1 },
  mealItemAmount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md, gap: spacing.xs },
  emptyIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: colors.warm, borderRadius: radii.medium, padding: 14 },
  noticeIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.warning, color: colors.white, textAlign: 'center', lineHeight: 22, fontWeight: '800' },
  noticeText: { color: colors.inkSoft, flex: 1, fontSize: 11, lineHeight: 17 },
  button: { minHeight: 54, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.68 },
});
