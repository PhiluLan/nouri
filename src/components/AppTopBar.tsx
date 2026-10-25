import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './ui';
import { colors, radii, spacing } from './theme';

export function AppTopBar({ label }: { label?: string }) {
  return <View style={styles.row}>
    <BrandMark compact />
    {label ? <Text style={styles.label}>{label}</Text> : <View style={styles.spacer} />}
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profil und Einstellungen öffnen"
      hitSlop={10}
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
    >
      <Text style={styles.profileText}>Profil</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spacer: { flex: 1 },
  label: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  profile: { minHeight: 36, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  profileText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.65 },
});
