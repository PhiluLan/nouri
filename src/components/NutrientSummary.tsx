import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NutrientKey, NutrientReference, NutrientTotal } from '../types/domain';
import { colors, radii, spacing } from './theme';
import { Card } from './ui';

const overview: NutrientKey[] = ['protein', 'fiber', 'epaDha', 'folate', 'vitaminB12', 'vitaminC', 'vitaminD', 'calcium', 'iron', 'magnesium', 'potassium', 'zinc'];
const groupNames: Record<NutrientReference['group'], string> = { basis: 'Grundlage', fats: 'Essenzielle Fettsäuren', vitamins: 'Vitamine', minerals: 'Mineralstoffe & Spurenelemente' };

export function NutrientSummary({ totals, references }: { totals: NutrientTotal[]; references: NutrientReference[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? references : overview.map((key) => references.find((item) => item.key === key)).filter((item): item is NutrientReference => Boolean(item));
  return <Card elevated style={styles.card}>
    {shown.map((reference, index) => {
      const total = totals.find((item) => item.key === reference.key);
      const amount = total?.amount ?? null;
      const ratio = amount === null ? 0 : Math.min(amount / reference.target, 1);
      const inRange = amount !== null && (reference.kind === 'maximum' ? amount <= reference.target : ratio >= 0.8);
      const showGroup = expanded && (index === 0 || shown[index - 1].group !== reference.group);
      return <View key={reference.key}>
        {showGroup ? <Text style={[styles.group, index > 0 && styles.groupSpacing]}>{groupNames[reference.group]}</Text> : null}
        <View style={[styles.item, index < shown.length - 1 && styles.divider]}>
          <View style={styles.row}>
            <View style={styles.nameRow}>
              <View style={[styles.dot, { backgroundColor: amount === null ? colors.lineStrong : inRange ? colors.success : colors.accent }]} />
              <Text style={styles.name}>{reference.label}</Text>
            </View>
            <Text style={styles.value}>{amount === null ? 'nicht dokumentiert' : `${total?.complete ? '' : 'mind. '}${format(amount)} ${reference.unit}`}</Text>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: inRange ? colors.success : colors.primary }]} /></View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{amount === null ? 'Für heute liegt kein Wert vor.' : `${targetLabel(reference)} Referenz`}</Text>
            {amount !== null && !total?.complete ? <Text style={styles.incomplete}>Abdeckung {total?.knownItems}/{total?.totalItems}</Text> : null}
          </View>
          {expanded && reference.note ? <Text style={styles.note}>{reference.note}</Text> : null}
        </View>
      </View>;
    })}
    <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
      <Text style={styles.moreText}>{expanded ? 'Kompakte Übersicht' : `Alle ${references.length} Referenzbereiche anzeigen`}</Text>
    </Pressable>
  </Card>;
}

function targetLabel(reference: NutrientReference) {
  if (reference.kind === 'maximum') return `höchstens ${format(reference.target)} ${reference.unit}`;
  return reference.targetMax === undefined ? `${format(reference.target)} ${reference.unit}` : `${format(reference.target)}–${format(reference.targetMax)} ${reference.unit}`;
}
function format(value: number) { return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(1)).toLocaleString('de-CH'); }

const styles = StyleSheet.create({
  card: { borderRadius: radii.large, paddingVertical: spacing.xs },
  group: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, paddingTop: spacing.sm },
  groupSpacing: { marginTop: spacing.sm },
  item: { paddingHorizontal: spacing.xs, paddingVertical: 13, gap: spacing.xs },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  value: { color: colors.inkSoft, fontSize: 12, textAlign: 'right', flexShrink: 1, fontWeight: '600' },
  track: { height: 6, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  meta: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  incomplete: { color: colors.warning, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  more: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  moreText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
