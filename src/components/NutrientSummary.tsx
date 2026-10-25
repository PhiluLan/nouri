import { StyleSheet, Text, View } from 'react-native';
import type { NutrientReference, NutrientTotal } from '../types/domain';
import { colors, radii, spacing } from './theme';
import { Card } from './ui';

export function NutrientSummary({ totals, references }: { totals: NutrientTotal[]; references: NutrientReference[] }) {
  return <View style={styles.list}>{references.map((reference) => {
    const total = totals.find((item) => item.key === reference.key);
    const amount = total?.amount ?? null;
    const ratio = amount === null ? 0 : Math.min(amount / reference.target, 1);
    return <Card key={reference.key} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{reference.label}</Text>
        <Text style={styles.value}>{amount === null ? 'keine Daten' : `${total?.complete ? '' : 'mind. '}${format(amount)} / ${format(reference.target)} ${reference.unit}`}</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%` }]} /></View>
      <Text style={styles.meta}>{amount === null ? 'Noch kein dokumentierter Wert.' : total?.complete ? 'Alle erfassten Lebensmittel enthalten diesen Wert.' : `Datenabdeckung ${total?.knownItems}/${total?.totalItems} Lebensmittel – keine fehlenden Werte ergänzt.`}</Text>
    </Card>;
  })}</View>;
}

function format(value: number) {
  return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(1)).toLocaleString('de-CH');
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: { borderRadius: radii.medium, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  value: { color: colors.muted, fontSize: 12, textAlign: 'right', flexShrink: 1 },
  track: { height: 7, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.pill },
  meta: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
