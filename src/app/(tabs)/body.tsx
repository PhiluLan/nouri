import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { BodyLandscape } from '../../components/BodyLandscape';
import { NutrientInfoModal } from '../../components/NutrientInfoModal';
import { NutrientSourcesModal } from '../../components/NutrientSourcesModal';
import { Card, Heading, Notice, Screen } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { bodyRegion, type BodyRegionKey } from '../../nutrition/body-regions';
import { contributionsFor, groupContributionsByIngredient, type ContributionPeriod } from '../../nutrition/contributions';
import { referencesFor } from '../../nutrition/references';
import type { NutrientReference } from '../../types/domain';
import { isPreviewMode } from '../../lib/preview';

const periods: { key: ContributionPeriod; label: string; days: number }[] = [
  { key: 'day', label: 'Heute', days: 1 },
  { key: 'week', label: '7 Tage', days: 7 },
  { key: 'month', label: '30 Tage', days: 30 },
];

export default function BodyScreen() {
  const { profile } = useAuth();
  const { meals, loading, error, refresh } = useNutritionData();
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionKey>('brain');
  const [period, setPeriod] = useState<ContributionPeriod>('day');
  const [info, setInfo] = useState<NutrientReference | null>(null);
  const [sources, setSources] = useState<NutrientReference | null>(null);
  if (!profile) return null;
  const references = referencesFor(profile);
  const region = bodyRegion(selectedRegion);
  const regionReferences = region.nutrients.map((key) => references.find((item) => item.key === key)).filter((item): item is NutrientReference => Boolean(item));
  const selectedDays = periods.find((item) => item.key === period)?.days ?? 1;
  const documented = regionReferences.filter((reference) => contributionsFor(meals, reference.key, period).length > 0).length;

  return <Screen refreshing={loading && meals.length > 0} onRefresh={() => void refresh()}>
    <AppTopBar />
    <Heading eyebrow="Deine Körperlandschaft" title="Was unterstützt was?">Entdecke, welche Körperfunktionen mit deinen erfassten Nährstoffen zusammenhängen.</Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Körperansicht und Werte basieren auf gekennzeichneten Testdaten.</Notice> : null}
    {error ? <Notice danger>{error}</Notice> : null}
    {loading && !meals.length ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Deine Körperlandschaft wird aufgebaut …</Text></View> : null}

    <View style={styles.tabs}>{periods.map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: period === item.key }} onPress={() => setPeriod(item.key)} style={[styles.tab, period === item.key && styles.tabActive]}><Text style={[styles.tabText, period === item.key && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>

    <BodyLandscape selected={selectedRegion} onSelect={setSelectedRegion} />

    <Card elevated style={styles.regionCard}>
      <View style={styles.regionHeader}>
        <View style={styles.regionIcon}><Text style={styles.regionIconText}>{region.symbol}</Text></View>
        <View style={styles.regionHeaderCopy}><Text style={styles.regionEyebrow}>Ausgewählte Region</Text><Text style={styles.regionTitle}>{region.label}</Text></View>
        <View style={styles.countBadge}><Text style={styles.countValue}>{documented}</Text><Text style={styles.countLabel}>von {regionReferences.length}</Text></View>
      </View>
      <Text style={styles.regionDescription}>{region.description}</Text>
      <View style={styles.functions}>{region.functions.map((item) => <View key={item} style={styles.function}><Text style={styles.functionCheck}>✓</Text><Text style={styles.functionText}>{item}</Text></View>)}</View>
    </Card>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Zugehörige Nährstoffe</Text><Text style={styles.sectionMeta}>{periodLabel(period)}</Text></View>
    {regionReferences.map((reference) => {
      const contributions = contributionsFor(meals, reference.key, period);
      const amount = contributions.length ? contributions.reduce((sum, item) => sum + item.amount, 0) : null;
      const target = reference.target * selectedDays;
      const ratio = amount === null ? 0 : Math.min(amount / target, 1);
      const foods = groupContributionsByIngredient(contributions).slice(0, 3);
      return <Card key={reference.key} style={styles.nutrientCard}>
        <View style={styles.nutrientTop}>
          <View style={styles.nutrientCopy}><Text style={styles.nutrientName}>{reference.label}</Text><Text style={styles.nutrientAmount}>{amount === null ? 'Noch nicht dokumentiert' : `${format(amount)} ${reference.unit} erfasst`}</Text></View>
          <View style={styles.nutrientActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Herkunft von ${reference.label} anzeigen`} onPress={() => setSources(reference)} style={styles.sourceButton}><Text style={styles.sourceButtonText}>Woher?</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${reference.label} einfach erklärt`} onPress={() => setInfo(reference)} style={styles.infoButton}><Text style={styles.infoButtonText}>i</Text></Pressable>
          </View>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%` }]} /></View>
        <Text style={styles.orientation}>{amount === null ? `Orientierung für diesen Zeitraum: ${format(target)} ${reference.unit}` : `${Math.round(ratio * 100)} % der rechnerischen Orientierung für diesen Zeitraum erfasst`}</Text>
        {foods.length ? <View style={styles.foods}>{foods.map((food) => <View key={food.ingredient.toLocaleLowerCase('de-CH')} style={styles.foodChip}><Text style={styles.foodChipText}>{food.ingredient} · {format(food.amount)} {reference.unit}</Text></View>)}</View> : null}
      </Card>;
    })}

    <Notice>Die Zuordnung zeigt, welche normalen Körperfunktionen ein Nährstoff unterstützt. Sie zeigt weder, wo ein Nährstoff im Körper „landet“, noch einen körperlichen Mangel oder deinen medizinischen Versorgungsstatus.</Notice>
    <NutrientInfoModal reference={info} onClose={() => setInfo(null)} />
    <NutrientSourcesModal key={`${sources?.key ?? 'none'}-${period}`} reference={sources} meals={meals} initialPeriod={period} onClose={() => setSources(null)} />
  </Screen>;
}

function periodLabel(period: ContributionPeriod) {
  if (period === 'week') return 'letzte 7 Tage';
  if (period === 'month') return 'letzte 30 Tage';
  return 'heute';
}

function format(value: number) {
  return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(1)).toLocaleString('de-CH');
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 13 },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: colors.primarySoft, borderRadius: radii.pill },
  tab: { flex: 1, minHeight: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.surfaceRaised, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  regionCard: { gap: spacing.md },
  regionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  regionIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  regionIconText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  regionHeaderCopy: { flex: 1 },
  regionEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  regionTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  countBadge: { minWidth: 52, height: 48, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  countValue: { color: colors.primary, fontSize: 17, lineHeight: 18, fontWeight: '900' },
  countLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  regionDescription: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  functions: { gap: 8 },
  function: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  functionCheck: { width: 24, height: 24, borderRadius: 9, backgroundColor: colors.primarySoft, color: colors.success, textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '900' },
  functionText: { color: colors.inkSoft, fontSize: 12, flex: 1 },
  sectionHeader: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.35 },
  sectionMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  nutrientCard: { gap: 9 },
  nutrientTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nutrientCopy: { flex: 1 },
  nutrientName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  nutrientAmount: { color: colors.muted, fontSize: 11, marginTop: 2 },
  nutrientActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceButton: { height: 31, borderRadius: radii.pill, backgroundColor: colors.accentSoft, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  sourceButtonText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  infoButton: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900', fontFamily: 'Georgia' },
  track: { height: 8, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', minWidth: 3, backgroundColor: colors.primary, borderRadius: radii.pill },
  orientation: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foodChip: { backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  foodChipText: { color: colors.inkSoft, fontSize: 9, fontWeight: '700' },
});
