import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Notice, Screen, textStyles, Button } from '../../components/ui';
import { colors, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals } from '../../nutrition/engine';
import { makeRecommendations } from '../../nutrition/recommendations';
import { referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function RecommendationsScreen() {
  const { profile, signOut } = useAuth();
  const { today, loading, error } = useNutritionData();
  if (!profile) return null;
  const recommendations = makeRecommendations(aggregateMeals(today), referencesFor(profile), profile);

  return <Screen>
    <Heading eyebrow="Empfehlungen" title="Was heute gut passen könnte">Maximal drei Lebensmittel, abgeleitet aus ausreichend dokumentierten Einträgen und deinen Einschränkungen.</Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Vorschläge basieren nur auf gekennzeichneten Testdaten.</Notice> : null}
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Notice warning>{error}</Notice> : null}
    {!loading && recommendations.length === 0 ? <Notice>{today.length ? 'Für belastbare Vorschläge fehlen noch ausreichend vollständige Nährstoffdaten oder die erfasste Zufuhr liegt im Zielbereich.' : 'Erfasse zuerst eine Mahlzeit. Danach erscheinen hier passende Ergänzungen.'}</Notice> : null}
    {recommendations.map((recommendation, index) => <Card key={recommendation.food}>
      <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
      <Text style={styles.food}>{recommendation.food}</Text>
      <Text style={textStyles.muted}>{recommendation.reason}</Text>
    </Card>)}
    <Notice warning>nouri erkennt keine Mängel oder Krankheiten. Vorschläge ersetzen keine medizinische oder ernährungsmedizinische Beratung.</Notice>
    <Card>
      <Text style={styles.metaTitle}>Deine Grundlage</Text>
      <Text style={textStyles.muted}>{profile.reference_source} · Stand {profile.reference_version}</Text>
      <Text style={textStyles.muted}>Ernährungsfilter: {profile.diet.length ? profile.diet.join(', ') : 'keine'}</Text>
    </Card>
    {!isPreviewMode ? <Button secondary title="Abmelden" onPress={() => void signOut()} /> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.primary, fontWeight: '800' },
  food: { color: colors.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.4 },
  metaTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
});
