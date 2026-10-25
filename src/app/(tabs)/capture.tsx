import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MealEditor, mealItemsAreSavable } from '../../components/MealEditor';
import { Button, Field, Heading, Notice, Screen, textStyles } from '../../components/ui';
import { colors, spacing } from '../../components/theme';
import { analyzeMeal, saveMeal } from '../../services/meals';
import type { MealItem } from '../../types/domain';
import { isPreviewMode } from '../../lib/preview';

export default function CaptureScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState<'analyze' | 'save' | null>(null);

  async function analyze() {
    if (text.trim().length < 3) return Alert.alert('Was hast du gegessen?', 'Beschreibe mindestens ein Lebensmittel und möglichst die Menge.');
    setBusy('analyze');
    try {
      const result = await analyzeMeal(text.trim());
      setItems(result.items);
      setWarnings(result.warnings ?? []);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Analyse nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!mealItemsAreSavable(items)) return;
    setBusy('save');
    try {
      await saveMeal({ rawText: text.trim(), eatenAt: new Date().toISOString(), items });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText(''); setItems([]); setWarnings([]);
      router.replace('/(tabs)/day');
    } catch (error) {
      Alert.alert('Speichern nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  return <Screen>
    <Heading eyebrow="Erfassen" title="Was gab es?">Schreib es so, wie du es erzählen würdest. Mengen helfen bei einer besseren Schätzung.</Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Eingaben, Erkennung und Werte sind Testdaten und werden nicht hochgeladen.</Notice> : null}
    <Field label="Mahlzeit" multiline value={text} onChangeText={setText} placeholder="z. B. Eine Schale Haferflocken mit 200 ml Milch und einer Banane" />
    <Button title={items.length ? 'Erneut analysieren' : 'Mahlzeit verstehen'} onPress={analyze} loading={busy === 'analyze'} disabled={busy !== null || text.trim().length < 3} />
    {!items.length ? <View style={styles.examples}>
      <Text style={textStyles.label}>Gute Eingaben enthalten</Text>
      <Text style={textStyles.muted}>Lebensmittel · Menge oder Portion · Zubereitung</Text>
    </View> : <>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Erkannte Lebensmittel</Text>
        <Text style={textStyles.muted}>{items.length} Position{items.length === 1 ? '' : 'en'}</Text>
      </View>
      {warnings.map((warning) => <Notice warning key={warning}>{warning}</Notice>)}
      <MealEditor items={items} onChange={setItems} />
      <Notice>Die Nährstoffwerte werden deterministisch aus den angegebenen Gramm und den USDA-Werten pro 100 g berechnet. Fehlende USDA-Werte bleiben unbekannt.</Notice>
      <Button title="Mahlzeit speichern" onPress={save} loading={busy === 'save'} disabled={busy !== null || !mealItemsAreSavable(items)} />
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  examples: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.xs },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
});
