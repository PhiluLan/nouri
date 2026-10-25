import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from './theme';

export function Screen({ children, scroll = true, refreshing = false, onRefresh }: PropsWithChildren<{ scroll?: boolean; refreshing?: boolean; onRefresh?: () => void }>) {
  const content = scroll ? <ScrollView
    contentContainerStyle={styles.content}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="interactive"
    showsVerticalScrollIndicator={false}
    refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
  >{children}</ScrollView> : <View style={styles.content}>{children}</View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>{content}</SafeAreaView>;
}

export function Heading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <View style={styles.heading}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {children ? <Text style={styles.subtitle}>{children}</Text> : null}
  </View>;
}

export function Card({ children, style, tonal = false, elevated = false }: PropsWithChildren<{ style?: ViewStyle; tonal?: boolean; elevated?: boolean }>) {
  return <View style={[styles.card, tonal && styles.cardTonal, elevated && styles.cardElevated, style]}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#929A95" style={[styles.input, props.multiline && styles.multiline]} {...props} />
  </View>;
}

export function Button({ title, onPress, secondary, ghost, danger, disabled, loading }: { title: string; onPress: () => void; secondary?: boolean; ghost?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean }) {
  const light = secondary || ghost || danger;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, ghost && styles.buttonGhost, danger && styles.buttonDanger, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
    {loading ? <ActivityIndicator color={light ? colors.primary : colors.white} /> : <Text style={[styles.buttonText, light && styles.buttonTextSecondary, danger && styles.buttonTextDanger]}>{title}</Text>}
  </Pressable>;
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

export function Notice({ children, warning, danger }: PropsWithChildren<{ warning?: boolean; danger?: boolean }>) {
  return <View style={[styles.notice, warning && styles.noticeWarning, danger && styles.noticeDanger]}><Text style={styles.noticeText}>{children}</Text></View>;
}

export function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
  </View>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brand}>
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}><Text style={[styles.brandLetter, compact && styles.brandLetterCompact]}>n</Text></View>
    {!compact ? <Text style={styles.brandName}>nouri</Text> : null}
  </View>;
}

export function EmptyState({ symbol, title, children, action }: { symbol: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <Card tonal style={styles.emptyState}>
    <View style={styles.emptySymbol}><Text style={styles.emptySymbolText}>{symbol}</Text></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyBody}>{children}</Text>
    {action}
  </Card>;
}

export const textStyles = StyleSheet.create({
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'web' ? 64 : spacing.sm, gap: spacing.md, paddingBottom: 124 },
  heading: { gap: spacing.xs, marginBottom: spacing.sm, paddingTop: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.35 },
  subtitle: { color: colors.inkSoft, fontSize: 16, lineHeight: 24, maxWidth: 540 },
  card: { backgroundColor: colors.surface, borderRadius: radii.large, padding: spacing.md, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  cardTonal: { backgroundColor: colors.primarySoft, borderColor: 'transparent' },
  cardElevated: { backgroundColor: colors.surfaceRaised, shadowColor: colors.primary, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  fieldWrap: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: colors.surfaceRaised, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.lineStrong, minHeight: 54, paddingHorizontal: 16, color: colors.ink, fontSize: 16 },
  multiline: { minHeight: 132, paddingTop: 16, textAlignVertical: 'top', lineHeight: 23 },
  button: { minHeight: 54, borderRadius: radii.pill, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  buttonGhost: { backgroundColor: 'transparent', minHeight: 44 },
  buttonDanger: { backgroundColor: colors.dangerSoft },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  buttonTextSecondary: { color: colors.primary },
  buttonTextDanger: { color: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  notice: { borderRadius: radii.medium, padding: 15, backgroundColor: colors.primarySoft },
  noticeWarning: { backgroundColor: colors.warm },
  noticeDanger: { backgroundColor: colors.dangerSoft },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  sectionHeader: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.35 },
  sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  brandMarkCompact: { width: 34, height: 34, borderRadius: 12 },
  brandLetter: { color: colors.accent, fontSize: 25, lineHeight: 29, fontWeight: '800', transform: [{ rotate: '4deg' }] },
  brandLetterCompact: { fontSize: 21, lineHeight: 25 },
  brandName: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptySymbol: { width: 54, height: 54, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  emptySymbolText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: colors.inkSoft, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
});
