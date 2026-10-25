import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { analyzeMeal } from '../services/meals';
import { hasUsableNutrientData, missingNutrients, updateItemAmount } from '../nutrition/engine';
import { NUTRIENT_KEYS, type MealItem } from '../types/domain';
import { Button, Card, Notice } from './ui';
import { colors, radii, spacing } from './theme';

export function MealEditor({ items, onChange }: { items: MealItem[]; onChange: (items: MealItem[]) => void }) {
  const [matching, setMatching] = useState<number | null>(null);

  function patch(index: number, next: MealItem) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  }

  function changeName(index: number, name: string) {
    const item = items[index];
    patch(index, {
      ...item,
      display_name: name,
      fdc_id: null,
      fdc_description: null,
      data_type: null,
      nutrients_per_100g: {},
      nutrients_for_amount: {},
      missing_nutrients: missingNutrients({}),
      source_url: null,
      match_confidence: 'low',
      notes: 'Lebensmittel geändert; erneuter USDA-Abgleich erforderlich.',
    });
  }

  function changeAmount(index: number, input: string) {
    const amount = Number(input.replace(',', '.'));
    patch(index, updateItemAmount(items[index], Number.isFinite(amount) ? amount : 0));
  }

  async function rematch(index: number) {
    const item = items[index];
    if (!item.display_name.trim() || item.amount_g <= 0) return;
    setMatching(index);
    try {
      const result = await analyzeMeal(`${item.amount_g} g ${item.display_name}`);
      const matched = result.items[0];
      patch(index, { ...matched, display_name: item.display_name, amount_g: item.amount_g, nutrients_for_amount: updateItemAmount(matched, item.amount_g).nutrients_for_amount });
    } catch (error) {
      Alert.alert('Abgleich nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setMatching(null);
    }
  }

  return <View style={styles.list}>
    {items.map((item, index) => <Card elevated key={`${item.fdc_id ?? 'new'}-${index}`} style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.indexBadge}><Text style={styles.index}>{index + 1}</Text></View>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeButton}><Text style={styles.remove}>Entfernen</Text></Pressable>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Lebensmittel</Text>
        <TextInput accessibilityLabel={`Lebensmittel ${index + 1}`} value={item.display_name} onChangeText={(value) => changeName(index, value)} style={styles.input} />
      </View>
      <View style={styles.amountRow}>
        <View style={styles.amountField}>
          <Text style={styles.label}>Menge</Text>
          <TextInput accessibilityLabel={`Menge für ${item.display_name} in Gramm`} value={item.amount_g ? String(item.amount_g) : ''} onChangeText={(value) => changeAmount(index, value)} keyboardType="decimal-pad" style={styles.input} />
        </View>
        <View style={styles.unitBadge}><Text style={styles.unit}>Gramm</Text></View>
      </View>
      {hasUsableNutrientData(item) ? <>
        <View style={styles.sourceBox}>
          <View style={styles.sourceHeader}>
            <Text style={styles.sourceTitle}>{item.data_type === 'Preview-Mock' ? 'Lokale Preview-Daten' : 'USDA FoodData Central'}</Text>
            <View style={[styles.confidence, item.match_confidence !== 'high' && styles.confidenceWarning]}><Text style={styles.confidenceText}>{confidenceLabel(item.match_confidence)}</Text></View>
          </View>
          <Text style={styles.sourceDescription}>{item.fdc_description}</Text>
          <Text style={styles.sourceMeta}>{item.data_type === 'Preview-Mock' ? 'Nicht für Produktionsberechnungen' : `FDC ${item.fdc_id} · ${item.data_type} · ${Object.keys(item.nutrients_per_100g).length}/${NUTRIENT_KEYS.length} Werte`}</Text>
        </View>
        {item.quantity_confidence !== 'high' ? <Notice warning>Die eingegebene Portionsmenge ist {item.quantity_confidence === 'low' ? 'unsicher' : 'geschätzt'}. Bitte prüfen.</Notice> : null}
      </> : <>
        <Notice warning>Diese Bezeichnung ist noch nicht mit FoodData Central abgeglichen. Ohne Quelle kann sie nicht gespeichert werden.</Notice>
        <Button secondary title="Mit USDA abgleichen" onPress={() => rematch(index)} loading={matching === index} />
      </>}
    </Card>)}
  </View>;
}

export function mealItemsAreSavable(items: MealItem[]): boolean {
  return items.length > 0 && items.every((item) => item.amount_g > 0 && item.display_name.trim() && hasUsableNutrientData(item));
}

function confidenceLabel(value: MealItem['match_confidence']) {
  if (value === 'high') return 'hohe Sicherheit';
  if (value === 'medium') return 'mittlere Sicherheit';
  return 'bitte prüfen';
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { padding: spacing.lg, gap: spacing.md },
  indexBadge: { width: 30, height: 30, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  index: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  removeButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 4 },
  remove: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  field: { gap: spacing.xs },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9 },
  input: { borderRadius: radii.small, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.background, color: colors.ink, fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  amountField: { flex: 1, gap: spacing.xs },
  unitBadge: { height: 50, borderRadius: radii.small, paddingHorizontal: 14, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  unit: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  sourceBox: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: spacing.md, gap: 5 },
  sourceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sourceTitle: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sourceDescription: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  sourceMeta: { color: colors.muted, fontSize: 11 },
  confidence: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  confidenceWarning: { backgroundColor: colors.warm },
  confidenceText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
});
