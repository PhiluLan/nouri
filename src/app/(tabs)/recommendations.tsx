import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { Button, Card, EmptyState, Heading, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals } from '../../nutrition/engine';
import { makeRecommendations } from '../../nutrition/recommendations';
import { nutrientLabel, referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function RecommendationsScreen() {
  const { profile } = useAuth();
  const { today, loading, error, refresh } = useNutritionData();
  if (!profile) return null;
  const recommendations = makeRecommendations(aggregateMeals(today), referencesFor(profile), profile);

  return <Screen refreshing={loading && today.length > 0} onRefresh={() => void refresh()}>
    <AppTopBar />
    <Heading eyebrow="Sinnvoll ergänzen" title="Was heute gut passen könnte">
      Bis zu drei konkrete Lebensmittel – aus deinen Einträgen abgeleitet und nach deinen Einschränkungen gefiltert.
    </Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Vorschläge basieren nur auf gekennzeichneten Testdaten.</Notice> : null}
    {loading && !today.length ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Passende Ideen werden zusammengestellt …</Text></View> : null}
    {error ? <Notice danger>{error}</Notice> : null}

    {!loading && recommendations.length === 0 ? <EmptyState symbol="✦" title={today.length ? 'Heute passt es so' : 'Noch keine Grundlage'} action={!today.length ? <Button title="Mahlzeit erfassen" onPress={() => router.push('/(tabs)/capture')} /> : undefined}>
      {today.length ? 'Für belastbare Vorschläge fehlen vollständige Daten oder die dokumentierten Bereiche liegen bereits nah an den Referenzwerten.' : 'Erfasse zuerst eine Mahlzeit. Danach kann nouri sinnvolle Ergänzungen auswählen.'}
    </EmptyState> : null}

    {recommendations.length ? <SectionHeader title="Deine Auswahl" meta={`${recommendations.length} ${recommendations.length === 1 ? 'Idee' : 'Ideen'}`} /> : null}
    {recommendations.map((recommendation, index) => <Card elevated key={recommendation.food} style={styles.recommendation}>
      <View style={styles.cardTop}>
        <View style={styles.number}><Text style={styles.numberText}>0{index + 1}</Text></View>
        <View style={styles.nutrientBadge}><Text style={styles.nutrientText}>{nutrientLabel(recommendation.nutrient)}</Text></View>
      </View>
      <Text style={styles.food}>{recommendation.food}</Text>
      <Text style={styles.reason}>{recommendation.reason}</Text>
      <View style={styles.divider} />
      <Button secondary title="Als Mahlzeit erfassen" onPress={() => router.push({ pathname: '/(tabs)/capture', params: { suggestion: recommendation.food } })} />
    </Card>)}

    <SectionHeader title="So entstehen diese Ideen" />
    <Card tonal>
      <Text style={styles.explainTitle}>Einfach, regelbasiert, nachvollziehbar</Text>
      <Text style={styles.explainText}>nouri betrachtet nur ausreichend dokumentierte Nährstoffwerte, vergleicht sie mit deinen persönlichen Referenzwerten und filtert Lebensmittel anhand deiner Ernährungsweise und Allergien.</Text>
      <Text style={styles.explainMeta}>Grundlage: {profile.reference_source} · Stand {profile.reference_version}</Text>
    </Card>
    <Notice warning>Keine Diagnose: Erfasste Zufuhr ist nicht gleich körperlicher Versorgungsstatus. Bei gesundheitlichen Fragen wende dich an eine Fachperson.</Notice>
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 14 },
  recommendation: { padding: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  nutrientBadge: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 6 },
  nutrientText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  food: { color: colors.ink, fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8 },
  reason: { color: colors.inkSoft, fontSize: 15, lineHeight: 22 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  explainTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  explainText: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  explainMeta: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
