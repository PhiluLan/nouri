import { StyleSheet, Text, View } from 'react-native';
import type { NutrientReference, NutrientTotal } from '../types/domain';
import { colors, radii, spacing } from './theme';
import { Card } from './ui';

export function NutrientSummary({ totals, references }: { totals: NutrientTotal[]; references: NutrientReference[] }) {
  return <Card elevated style={styles.card}>{references.map((reference, index) => {
    const total = totals.find((item) => item.key === reference.key);
    const amount = total?.amount ?? null;
    const ratio = amount === null ? 0 : Math.min(amount / reference.target, 1);
    return <View key={reference.key} style={[styles.item, index < references.length - 1 && styles.divider]}>
      <View style={styles.row}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: amount === null ? colors.lineStrong : ratio >= 0.8 ? colors.success : colors.accent }]} />
          <Text style={styles.name}>{reference.label}</Text>
        </View>
        <Text style={styles.value}>{amount === null ? 'nicht dokumentiert' : `${total?.complete ? '' : 'mind. '}${format(amount)} ${reference.unit}`}</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: ratio >= 0.8 ? colors.success : colors.primary }]} /></View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{amount === null ? 'Für heute liegt kein Wert vor.' : `${format(reference.target)} ${reference.unit} Referenz`}</Text>
        {amount !== null && !total?.complete ? <Text style={styles.incomplete}>Abdeckung {total?.knownItems}/{total?.totalItems}</Text> : null}
      </View>
    </View>;
  })}</Card>;
}

function format(value: number) {
  return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(1)).toLocaleString('de-CH');
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.large, paddingVertical: spacing.xs },
  item: { paddingHorizontal: spacing.xs, paddingVertical: 13, gap: spacing.xs },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  value: { color: colors.inkSoft, fontSize: 12, textAlign: 'right', flexShrink: 1, fontWeight: '600' },
  track: { height: 6, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.pill },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  meta: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  incomplete: { color: colors.warning, fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
