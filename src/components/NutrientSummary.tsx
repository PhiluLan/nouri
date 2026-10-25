import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NutrientKey, NutrientReference, NutrientTotal } from '../types/domain';
import { colors, radii, spacing } from './theme';
import { Card } from './ui';
import { NutrientInfoModal } from './NutrientInfoModal';

const featuredKeys: NutrientKey[] = ['protein', 'fiber', 'epaDha', 'folate', 'vitaminB12', 'vitaminC', 'vitaminD', 'calcium', 'iron', 'potassium'];
const groupNames: Record<NutrientReference['group'], string> = { basis: 'Grundlage', fats: 'Essenzielle Fettsäuren', vitamins: 'Vitamine', minerals: 'Mineralstoffe & Spurenelemente' };

export function NutrientSummary({ totals, references }: { totals: NutrientTotal[]; references: NutrientReference[] }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<NutrientReference | null>(null);
  const featured = featuredKeys.map((key) => references.find((item) => item.key === key)).filter((item): item is NutrientReference => Boolean(item));
  const additional = references.filter((item) => !featuredKeys.includes(item.key));

  return <>
    <Card elevated style={styles.featuredCard}>
      <View style={styles.cardIntro}>
        <View>
          <Text style={styles.cardEyebrow}>Deine 10 im Blick</Text>
          <Text style={styles.cardTitle}>Was heute besonders zählt</Text>
        </View>
        <View style={styles.tenBadge}><Text style={styles.tenBadgeText}>10</Text></View>
      </View>
      {featured.map((reference, index) => <NutrientRow key={reference.key} reference={reference} total={totals.find((item) => item.key === reference.key)} onInfo={() => setSelected(reference)} featured divider={index < featured.length - 1} />)}
    </Card>

    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}>
      <View>
        <Text style={styles.expandTitle}>{expanded ? 'Weitere Nährstoffe ausblenden' : `Weitere ${additional.length} Nährstoffe`}</Text>
        <Text style={styles.expandMeta}>{expanded ? 'Die wichtigsten 10 bleiben sichtbar' : 'Alle Referenzbereiche ansehen'}</Text>
      </View>
      <View style={styles.chevron}><Text style={styles.chevronText}>{expanded ? '↑' : '↓'}</Text></View>
    </Pressable>

    {expanded ? <Card style={styles.additionalCard}>
      {additional.map((reference, index) => {
        const showGroup = index === 0 || additional[index - 1].group !== reference.group;
        return <View key={reference.key}>
          {showGroup ? <Text style={[styles.group, index > 0 && styles.groupSpacing]}>{groupNames[reference.group]}</Text> : null}
          <NutrientRow reference={reference} total={totals.find((item) => item.key === reference.key)} onInfo={() => setSelected(reference)} divider={index < additional.length - 1} />
        </View>;
      })}
    </Card> : null}

    <NutrientInfoModal reference={selected} onClose={() => setSelected(null)} />
  </>;
}

function NutrientRow({ reference, total, onInfo, featured = false, divider = false }: { reference: NutrientReference; total?: NutrientTotal; onInfo: () => void; featured?: boolean; divider?: boolean }) {
  const amount = total?.amount ?? null;
  const ratio = amount === null ? 0 : Math.min(amount / reference.target, 1);
  const good = amount !== null && (reference.kind === 'maximum' ? amount <= reference.target : ratio >= 0.8);
  return <View style={[styles.item, featured && styles.itemFeatured, divider && styles.divider]}>
    <View style={styles.row}>
      <View style={styles.nameWrap}>
        <Text style={[styles.name, featured && styles.nameFeatured]}>{reference.label}</Text>
        <Text style={styles.status}>{statusLabel(reference, amount, ratio)}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${reference.label} einfach erklärt`} hitSlop={8} onPress={onInfo} style={({ pressed }) => [styles.info, pressed && styles.pressed]}><Text style={styles.infoText}>i</Text></Pressable>
    </View>
    <View style={styles.amountRow}>
      <Text style={[styles.amount, featured && styles.amountFeatured]}>{amount === null ? 'Noch keine Daten' : `${total?.complete ? '' : 'mind. '}${format(amount)} ${reference.unit}`}</Text>
      <Text style={styles.target}>{targetLabel(reference)}</Text>
    </View>
    <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: good ? colors.success : colors.primary }]} /></View>
    {amount !== null && !total?.complete ? <Text style={styles.coverage}>Daten für {total?.knownItems} von {total?.totalItems} erfassten Lebensmitteln</Text> : null}
    {featured && reference.note ? <Text style={styles.note}>{reference.note}</Text> : null}
  </View>;
}

function statusLabel(reference: NutrientReference, amount: number | null, ratio: number) {
  if (amount === null) return 'Heute noch nicht dokumentiert';
  if (reference.kind === 'maximum') return amount <= reference.target ? 'Im Orientierungsbereich' : 'Über dem Orientierungswert';
  if (ratio >= 1) return 'Tagesreferenz erreicht';
  if (ratio >= 0.8) return 'Nahe an der Tagesreferenz';
  if (ratio >= 0.35) return 'Teilweise erfasst';
  return 'Bisher wenig erfasst';
}

function targetLabel(reference: NutrientReference) {
  if (reference.kind === 'maximum') return `bis ${format(reference.target)} ${reference.unit}`;
  return reference.targetMax === undefined ? `Ziel ca. ${format(reference.target)} ${reference.unit}` : `Ziel ${format(reference.target)}–${format(reference.targetMax)} ${reference.unit}`;
}

function format(value: number) { return value >= 100 ? Math.round(value).toLocaleString('de-CH') : Number(value.toFixed(1)).toLocaleString('de-CH'); }

const styles = StyleSheet.create({
  featuredCard: { borderRadius: radii.large, padding: spacing.md, gap: 0 },
  cardIntro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xs, paddingBottom: spacing.md },
  cardEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  cardTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800', marginTop: 3 },
  tenBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  tenBadgeText: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  item: { paddingHorizontal: spacing.xs, paddingVertical: 12, gap: 7 },
  itemFeatured: { paddingVertical: 15 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameWrap: { flex: 1 },
  name: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  nameFeatured: { fontSize: 16 },
  status: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  info: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.primary, fontSize: 14, fontWeight: '900', fontFamily: 'Georgia' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  amount: { color: colors.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  amountFeatured: { fontSize: 15 },
  target: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  track: { height: 9, backgroundColor: colors.primarySoft, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', minWidth: 3, borderRadius: radii.pill },
  coverage: { color: colors.warning, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  expandButton: { minHeight: 72, borderRadius: radii.medium, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginTop: spacing.xs },
  expandTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  expandMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  chevron: { width: 34, height: 34, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chevronText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  additionalCard: { paddingVertical: spacing.xs, gap: 0 },
  group: { color: colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, paddingTop: spacing.md },
  groupSpacing: { marginTop: spacing.sm },
  pressed: { opacity: 0.62 },
});
