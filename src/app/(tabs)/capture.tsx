import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { MealEditor, mealItemsAreSavable } from '../../components/MealEditor';
import { Button, Card, Chip, Heading, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { analyzeMeal, saveMeal } from '../../services/meals';
import type { MealItem } from '../../types/domain';
import { isPreviewMode } from '../../lib/preview';

const examples = [
  'Haferflocken mit Milch und Banane',
  'Linsensalat mit Tomaten und Feta',
  'Vollkornbrot mit Ei und Avocado',
];

export default function CaptureScreen() {
  const { suggestion } = useLocalSearchParams<{ suggestion?: string }>();
  const appliedSuggestion = useRef(false);
  const [text, setText] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState<'analyze' | 'save' | null>(null);

  useEffect(() => {
    if (suggestion && !appliedSuggestion.current) {
      setText(suggestion);
      appliedSuggestion.current = true;
    }
  }, [suggestion]);

  function updateText(value: string) {
    setText(value);
    if (items.length) {
      setItems([]);
      setWarnings([]);
    }
  }

  async function analyze() {
    if (text.trim().length < 3) return Alert.alert('Was hast du gegessen?', 'Beschreibe mindestens ein Lebensmittel und möglichst die Menge.');
    setBusy('analyze');
    try {
      const result = await analyzeMeal(text.trim());
      setItems(result.items);
      setWarnings(result.warnings ?? []);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Speichern nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  return <Screen>
    <AppTopBar />
    <Heading eyebrow={items.length ? 'Schritt 2 · Prüfen' : 'Schritt 1 · Beschreiben'} title={items.length ? 'Passt alles?' : 'Was gab es?'}>
      {items.length ? 'Korrigiere Lebensmittel und Grammangaben, bevor du speicherst.' : 'Schreib es so, wie du es erzählen würdest. Mengen und Zubereitung machen die Schätzung genauer.'}
    </Heading>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Eingaben, Erkennung und Werte sind Testdaten und werden nicht hochgeladen.</Notice> : null}

    <Card elevated style={styles.composer}>
      <Text style={styles.inputLabel}>Deine Mahlzeit</Text>
      <View style={styles.inputFrame}>
        <TextInputWithCount value={text} onChangeText={updateText} />
      </View>
      <Button title={busy === 'analyze' ? 'Lebensmittel werden erkannt …' : items.length ? 'Neu analysieren' : 'Mahlzeit verstehen'} onPress={() => void analyze()} loading={busy === 'analyze'} disabled={busy !== null || text.trim().length < 3} />
    </Card>

    {!items.length ? <>
      <Text style={styles.tip}>Tipp: „200 g Naturjoghurt mit einer Banane und 2 EL Haferflocken“ ist genauer als „Frühstück“.</Text>
      <SectionHeader title="Schnell starten" />
      <View style={styles.examples}>{examples.map((example) => <Chip key={example} label={example} onPress={() => updateText(example)} />)}</View>
      <Card tonal style={styles.promise}>
        <Text style={styles.promiseTitle}>Was nouri daraus macht</Text>
        <View style={styles.promiseRow}><Text style={styles.promiseNumber}>1</Text><Text style={styles.promiseText}>Lebensmittel und Mengen erkennen</Text></View>
        <View style={styles.promiseRow}><Text style={styles.promiseNumber}>2</Text><Text style={styles.promiseText}>Mit USDA-Quellen abgleichen</Text></View>
        <View style={styles.promiseRow}><Text style={styles.promiseNumber}>3</Text><Text style={styles.promiseText}>Nährstoffzufuhr verständlich einordnen</Text></View>
      </Card>
    </> : <>
      <SectionHeader title="Erkannte Lebensmittel" meta={`${items.length} ${items.length === 1 ? 'Position' : 'Positionen'}`} />
      {warnings.length ? <Notice warning>{warnings.join('\n')}</Notice> : <Notice>Alle Positionen haben eine dokumentierte USDA-Zuordnung. Prüfe trotzdem, ob Lebensmittel und Mengen zu deiner Mahlzeit passen.</Notice>}
      <MealEditor items={items} onChange={setItems} />
      <Card tonal style={styles.sourceNote}>
        <Text style={styles.sourceTitle}>Nachvollziehbar berechnet</Text>
        <Text style={styles.sourceText}>USDA-Wert pro 100 g × deine Menge. Nicht dokumentierte Werte bleiben unbekannt und werden niemals als null ergänzt.</Text>
      </Card>
      <Button title="Mahlzeit speichern" onPress={() => void save()} loading={busy === 'save'} disabled={busy !== null || !mealItemsAreSavable(items)} />
      <Button ghost title="Eingabe verwerfen" onPress={() => { setText(''); setItems([]); setWarnings([]); }} disabled={busy !== null} />
    </>}
  </Screen>;
}

function TextInputWithCount({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return <>
    <TextInput
      accessibilityLabel="Mahlzeit beschreiben"
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={500}
      placeholder="z. B. Eine Schale Haferflocken mit 200 ml Milch und einer Banane"
      placeholderTextColor="#87938D"
      style={styles.input}
      textAlignVertical="top"
    />
    <Text style={styles.counter}>{value.length}/500</Text>
  </>;
}

const styles = StyleSheet.create({
  composer: { gap: spacing.md },
  inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  inputFrame: { minHeight: 150, borderRadius: radii.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.lineStrong, overflow: 'hidden' },
  input: { minHeight: 122, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 6, color: colors.ink, fontSize: 17, lineHeight: 24 },
  counter: { color: colors.muted, fontSize: 10, textAlign: 'right', paddingHorizontal: 12, paddingBottom: 9 },
  tip: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: spacing.xs },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  promise: { marginTop: spacing.sm, gap: spacing.md },
  promiseTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promiseNumber: { width: 26, height: 26, borderRadius: 10, backgroundColor: colors.surface, color: colors.primary, textAlign: 'center', lineHeight: 26, fontSize: 12, fontWeight: '800' },
  promiseText: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, flex: 1 },
  sourceNote: { gap: spacing.xs },
  sourceTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  sourceText: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
});
