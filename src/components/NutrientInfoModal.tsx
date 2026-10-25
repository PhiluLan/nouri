import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nutrientInfo } from '../nutrition/nutrient-info';
import type { NutrientReference } from '../types/domain';
import { colors, radii, spacing } from './theme';

export function NutrientInfoModal({ reference, onClose }: { reference: NutrientReference | null; onClose: () => void }) {
  if (!reference) return null;
  const content = nutrientInfo[reference.key];
  return <Modal visible animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="Info schliessen" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.icon}><Text style={styles.iconText}>{content.icon}</Text></View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Einfach erklärt</Text>
              <Text style={styles.title}>{reference.label}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Schliessen" hitSlop={10} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <Text style={styles.intro}>{content.simple}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dafür braucht dein Körper es</Text>
            {content.roles.map((role) => <View key={role} style={styles.roleRow}><View style={styles.check}><Text style={styles.checkText}>✓</Text></View><Text style={styles.roleText}>{role}</Text></View>)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Typische Lebensmittel</Text>
            <View style={styles.chips}>{content.foods.map((food) => <View key={food} style={styles.chip}><Text style={styles.chipText}>{food}</Text></View>)}</View>
          </View>

          <View style={styles.context}>
            <Text style={styles.contextSymbol}>i</Text>
            <Text style={styles.contextText}>nouri schätzt nur, wie viel du über deine erfassten Mahlzeiten aufgenommen hast. Das ist keine Aussage über deinen tatsächlichen Versorgungsstatus.</Text>
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Verstanden</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 38, 31, 0.42)' },
  sheet: { maxHeight: '91%', backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, alignSelf: 'center', marginTop: 10 },
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 36, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.primary, fontSize: 27, lineHeight: 30 },
  intro: { color: colors.inkSoft, fontSize: 17, lineHeight: 25 },
  section: { backgroundColor: colors.surfaceRaised, borderRadius: radii.medium, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: colors.success, fontSize: 13, fontWeight: '900' },
  roleText: { color: colors.inkSoft, flex: 1, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: colors.accentSoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.pill },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  context: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft, borderRadius: radii.medium, padding: 14 },
  contextSymbol: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, color: colors.white, textAlign: 'center', lineHeight: 22, fontWeight: '800' },
  contextText: { color: colors.inkSoft, flex: 1, fontSize: 12, lineHeight: 18 },
  button: { minHeight: 54, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
