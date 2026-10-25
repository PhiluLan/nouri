import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from './theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = scroll ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView> : <View style={styles.content}>{children}</View>;
  return <SafeAreaView style={styles.screen}>{content}</SafeAreaView>;
}

export function Heading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <View style={styles.heading}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {children ? <Text style={styles.subtitle}>{children}</Text> : null}
  </View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#929A95" style={[styles.input, props.multiline && styles.multiline]} {...props} />
  </View>;
}

export function Button({ title, onPress, secondary, disabled, loading }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; loading?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
    {loading ? <ActivityIndicator color={secondary ? colors.primary : colors.white} /> : <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>}
  </Pressable>;
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

export function Notice({ children, warning }: PropsWithChildren<{ warning?: boolean }>) {
  return <View style={[styles.notice, warning && styles.noticeWarning]}><Text style={styles.noticeText}>{children}</Text></View>;
}

export const textStyles = StyleSheet.create({
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, maxWidth: 520 },
  card: { backgroundColor: colors.surface, borderRadius: radii.large, padding: spacing.md, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  fieldWrap: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: colors.surface, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, minHeight: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 16 },
  multiline: { minHeight: 118, paddingTop: 14, textAlignVertical: 'top' },
  button: { minHeight: 52, borderRadius: radii.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  buttonTextSecondary: { color: colors.primary },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextSelected: { color: colors.primary },
  notice: { borderRadius: radii.medium, padding: 14, backgroundColor: colors.primarySoft },
  noticeWarning: { backgroundColor: colors.warm },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
});
