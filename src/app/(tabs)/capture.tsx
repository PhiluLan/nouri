import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { MealEditor, mealItemsAreSavable } from '../../components/MealEditor';
import { Button, Card, Chip, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { cloneMealItems, eatenAtForMoment, mealEmoji, mealMoments, smartMeals, type MealMoment } from '../../nutrition/capture-smart';
import { analyzeMeal, createMealTemplate, deleteMealTemplate, fetchMealTemplates, markMealTemplateUsed, saveMeal } from '../../services/meals';
import type { Meal, MealItem, MealTemplate } from '../../types/domain';
import { isPreviewMode } from '../../lib/preview';
import { isSuspiciousFoodMatch } from '../../nutrition/food-match';
import { useNutritionData } from '../../hooks/useNutritionData';

const starterIdeas = [
  { symbol: '☕️', label: 'Kaffee + Milch', text: 'Eine Tasse Kaffee mit 100 ml Milch' },
  { symbol: '💧', label: 'Wasser', text: 'Ein Glas Wasser, 300 ml' },
  { symbol: '🍎', label: 'Kleiner Snack', text: 'Ein Apfel' },
];

export default function CaptureScreen() {
  const { suggestion } = useLocalSearchParams<{ suggestion?: string }>();
  const appliedSuggestion = useRef(false);
  const { meals, today, loading: mealsLoading, refresh: refreshMeals } = useNutritionData();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [text, setText] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [moment, setMoment] = useState<MealMoment>('now');
  const [busy, setBusy] = useState<'analyze' | 'save' | string | null>(null);
  const suggestions = useMemo(() => smartMeals(meals).filter((meal) => !templates.some((template) => sameMeal(template.raw_text, meal.raw_text))).slice(0, 4), [meals, templates]);
  const reviewCount = items.filter((item) => item.match_confidence === 'low' || isSuspiciousFoodMatch(item)).length;
  const estimatedCount = items.filter((item) => item.quantity_confidence !== 'high').length;

  const refreshTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      setTemplates(await fetchMealTemplates());
    } catch (error) {
      Alert.alert('Favoriten nicht verfügbar', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refreshTemplates(); }, [refreshTemplates]));

  useEffect(() => {
    if (suggestion && !appliedSuggestion.current) {
      setText(suggestion);
      appliedSuggestion.current = true;
    }
  }, [suggestion]);

  function updateText(value: string) {
    setText(value);
    if (items.length) setItems([]);
  }

  async function analyze() {
    if (text.trim().length < 3) return Alert.alert('Was hast du gegessen?', 'Beschreibe mindestens ein Lebensmittel und möglichst die Menge.');
    setBusy('analyze');
    try {
      const result = await analyzeMeal(text.trim());
      setItems(result.items);
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
      await saveMeal({ rawText: text.trim(), eatenAt: eatenAtForMoment(moment), items });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText('');
      setItems([]);
      router.replace('/(tabs)/day');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Speichern nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  async function quickAdd(source: Meal | MealTemplate, template?: MealTemplate) {
    const key = `quick-${source.id}`;
    setBusy(key);
    const sourceItems = 'meal_items' in source ? source.meal_items : source.items;
    try {
      await saveMeal({ rawText: source.raw_text, eatenAt: eatenAtForMoment(moment), items: cloneMealItems(sourceItems) });
      if (template) await markMealTemplateUsed(template).catch(() => undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/day');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Schnelleintrag nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  function adjust(source: Meal | MealTemplate) {
    setText(source.raw_text);
    setItems(cloneMealItems('meal_items' in source ? source.meal_items : source.items));
    void Haptics.selectionAsync();
  }

  async function addFavorite(meal: Meal) {
    setBusy(`favorite-${meal.id}`);
    try {
      await createMealTemplate({ name: meal.raw_text.trim().slice(0, 80), rawText: meal.raw_text, items: cloneMealItems(meal.meal_items) });
      await refreshTemplates();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Favorit nicht gespeichert', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  function confirmDeleteFavorite(template: MealTemplate) {
    Alert.alert('Favorit entfernen?', `„${template.name}“ bleibt in deinen bisherigen Mahlzeiten erhalten.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: async () => {
        setBusy(`delete-${template.id}`);
        try {
          await deleteMealTemplate(template.id);
          await refreshTemplates();
        } catch (error) {
          Alert.alert('Entfernen nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
        } finally {
          setBusy(null);
        }
      } },
    ]);
  }

  return <Screen refreshing={mealsLoading || templatesLoading} onRefresh={() => void Promise.all([refreshMeals(), refreshTemplates()])}>
    <AppTopBar />
    {!items.length ? <>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>{greeting()}</Text>
        <Text style={styles.heroTitle}>Was darf nouri{today.length ? ' noch' : ''} für dich festhalten?</Text>
        <Text style={styles.heroCopy}>{today.length ? `${today.length} ${today.length === 1 ? 'Eintrag' : 'Einträge'} heute · Erzähl es frei oder nimm eine Abkürzung.` : 'Erzähl es frei oder nimm eine Abkürzung.'}</Text>
      </View>
      {isPreviewMode ? <Notice warning>Lokale Vorschau · Eingaben, Erkennung und Werte sind Testdaten und werden nicht hochgeladen.</Notice> : null}

      <Card elevated style={styles.composer}>
        <View style={styles.composerTop}>
          <View style={styles.spark}><Text style={styles.sparkText}>✦</Text></View>
          <View style={styles.composerHeading}>
            <Text style={styles.composerTitle}>Einfach losschreiben</Text>
            <Text style={styles.composerSubtitle}>Menge und Zubereitung helfen nouri.</Text>
          </View>
        </View>
        <View style={styles.inputFrame}><TextInputWithCount value={text} onChangeText={updateText} /></View>
        <MomentPicker value={moment} onChange={setMoment} />
        <Button title={busy === 'analyze' ? 'nouri schaut nach …' : 'Verstehen & prüfen'} onPress={() => void analyze()} loading={busy === 'analyze'} disabled={busy !== null || text.trim().length < 3} />
      </Card>

      <View style={styles.starterRow}>
        {starterIdeas.map((idea) => <Pressable key={idea.label} accessibilityRole="button" onPress={() => updateText(idea.text)} style={({ pressed }) => [styles.starter, pressed && styles.pressed]}>
          <Text style={styles.starterSymbol}>{idea.symbol}</Text><Text style={styles.starterLabel}>{idea.label}</Text>
        </Pressable>)}
      </View>

      {(templates.length || suggestions.length) ? <>
        <SectionHeader title="Ein Tipp genügt" meta="mit geprüften Mengen" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRail}>
          {templates.map((template) => <QuickCard key={`template-${template.id}`} title={template.name} subtitle={`Favorit · ${ingredientSummary(template.items)}`} symbol={mealEmoji(template.raw_text)} busy={busy === `quick-${template.id}`} favorite onQuickAdd={() => void quickAdd(template, template)} onAdjust={() => adjust(template)} onFavorite={() => confirmDeleteFavorite(template)} />)}
          {suggestions.map((meal) => <QuickCard key={`meal-${meal.id}`} title={meal.raw_text} subtitle={`${meal.occurrences > 1 ? `${meal.occurrences}× erfasst` : meal.momentLabel} · ${ingredientSummary(meal.meal_items)}`} symbol={mealEmoji(meal.raw_text)} busy={busy === `quick-${meal.id}`} onQuickAdd={() => void quickAdd(meal)} onAdjust={() => adjust(meal)} onFavorite={() => void addFavorite(meal)} favoriteBusy={busy === `favorite-${meal.id}`} />)}
        </ScrollView>
        <Text style={styles.quickHint}>„+ Jetzt“ übernimmt die bereits geprüften Lebensmittel und Mengen. Mit „Anpassen“ kannst du vorher alles ändern.</Text>
      </> : !mealsLoading && !templatesLoading ? <Card tonal style={styles.firstTime}>
        <Text style={styles.firstTimeSymbol}>🌱</Text><View style={styles.firstTimeText}><Text style={styles.firstTimeTitle}>nouri lernt mit dir</Text><Text style={styles.firstTimeCopy}>Nach deinen ersten Einträgen erscheinen hier automatisch deine Routinen und letzten Mahlzeiten.</Text></View>
      </Card> : <ActivityIndicator color={colors.primary} />}
    </> : <>
      <View style={styles.reviewHeading}><Text style={styles.heroEyebrow}>Kurz prüfen</Text><Text style={styles.heroTitle}>Passt alles?</Text><Text style={styles.heroCopy}>Nur unsichere Stellen brauchen deine Aufmerksamkeit.</Text></View>
      <Card tonal style={styles.originalInput}><Text style={styles.originalLabel}>Deine Eingabe</Text><Text style={styles.originalText}>{text}</Text><MomentPicker value={moment} onChange={setMoment} /></Card>
      <SectionHeader title="Erkannte Lebensmittel" meta={`${items.length} ${items.length === 1 ? 'Position' : 'Positionen'}`} />
      {reviewCount ? <Notice warning>{reviewCount === 1 ? 'Eine Zuordnung ist nicht eindeutig. Bitte prüfe sie.' : `${reviewCount} Zuordnungen sind nicht eindeutig. Bitte prüfe sie.`}</Notice> : estimatedCount ? <Notice warning>{estimatedCount === 1 ? 'Bei einer Position wurde die Menge geschätzt.' : `Bei ${estimatedCount} Positionen wurden Mengen geschätzt.`}</Notice> : <Notice>Alles eindeutig erkannt. Ein kurzer Kontrollblick genügt.</Notice>}
      <MealEditor items={items} onChange={setItems} />
      <Card tonal style={styles.sourceNote}><Text style={styles.sourceTitle}>Nachvollziehbar berechnet</Text><Text style={styles.sourceText}>Dokumentierter USDA-Wert pro 100 g × deine Menge. Fehlende Werte bleiben unbekannt.</Text></Card>
      <Button title="Eintrag speichern" onPress={() => void save()} loading={busy === 'save'} disabled={busy !== null || !mealItemsAreSavable(items)} />
      <Button ghost title="Zurück zur Eingabe" onPress={() => setItems([])} disabled={busy !== null} />
    </>}
  </Screen>;
}

function MomentPicker({ value, onChange }: { value: MealMoment; onChange: (value: MealMoment) => void }) {
  return <View style={styles.momentWrap}><Text style={styles.momentLabel}>Wann war es?</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentRow}>
    {mealMoments.map((entry) => <Chip key={entry.key} label={entry.label} selected={value === entry.key} onPress={() => { onChange(entry.key); void Haptics.selectionAsync(); }} />)}
  </ScrollView></View>;
}

function QuickCard({ title, subtitle, symbol, busy, favorite, favoriteBusy, onQuickAdd, onAdjust, onFavorite }: { title: string; subtitle: string; symbol: string; busy: boolean; favorite?: boolean; favoriteBusy?: boolean; onQuickAdd: () => void; onAdjust: () => void; onFavorite: () => void }) {
  return <View style={styles.quickCard}>
    <View style={styles.quickTop}><View style={styles.quickSymbol}><Text style={styles.quickSymbolText}>{symbol}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Favorit entfernen' : 'Als Favorit speichern'} onPress={onFavorite} hitSlop={10} style={({ pressed }) => [styles.favoriteButton, favorite && styles.favoriteButtonActive, pressed && styles.pressed]}>{favoriteBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>{favorite ? '★' : '☆'}</Text>}</Pressable></View>
    <Text numberOfLines={2} style={styles.quickTitle}>{title}</Text><Text numberOfLines={2} style={styles.quickSubtitle}>{subtitle}</Text>
    <View style={styles.quickActions}><Pressable accessibilityRole="button" disabled={busy} onPress={onQuickAdd} style={({ pressed }) => [styles.quickPrimary, pressed && styles.pressed]}>{busy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.quickPrimaryText}>+ Jetzt</Text>}</Pressable><Pressable accessibilityRole="button" onPress={onAdjust} style={({ pressed }) => [styles.quickSecondary, pressed && styles.pressed]}><Text style={styles.quickSecondaryText}>Anpassen</Text></Pressable></View>
  </View>;
}

function TextInputWithCount({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return <><TextInput accessibilityLabel="Mahlzeit oder Getränk beschreiben" value={value} onChangeText={onChangeText} multiline maxLength={500} placeholder="z. B. Kaffee mit einem Schuss Milch" placeholderTextColor="#87938D" style={styles.input} textAlignVertical="top" /><Text style={styles.counter}>{value.length}/500</Text></>;
}

function ingredientSummary(items: MealItem[]): string { const names = items.slice(0, 2).map((item) => item.display_name); return `${names.join(' + ')}${items.length > 2 ? ` +${items.length - 2}` : ''}`; }
function greeting(): string { const hour = new Date().getHours(); return hour < 11 ? 'Guten Morgen' : hour < 17 ? 'Hallo' : 'Guten Abend'; }
function sameMeal(left: string, right: string): boolean { return left.trim().toLowerCase() === right.trim().toLowerCase(); }

const styles = StyleSheet.create({
  hero: { gap: spacing.xs, paddingTop: spacing.xs, marginBottom: spacing.xs },
  reviewHeading: { gap: spacing.xs, paddingTop: spacing.xs },
  heroEyebrow: { color: colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTitle: { color: colors.ink, fontSize: 33, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2 },
  heroCopy: { color: colors.inkSoft, fontSize: 15, lineHeight: 22, maxWidth: 520 },
  composer: { gap: spacing.md, padding: 18 },
  composerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spark: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  sparkText: { color: colors.primary, fontSize: 21, fontWeight: '800' },
  composerHeading: { flex: 1, gap: 2 },
  composerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  composerSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  inputFrame: { minHeight: 112, borderRadius: radii.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.lineStrong, overflow: 'hidden' },
  input: { minHeight: 84, paddingHorizontal: 15, paddingTop: 14, paddingBottom: 4, color: colors.ink, fontSize: 17, lineHeight: 24 },
  counter: { color: colors.muted, fontSize: 10, textAlign: 'right', paddingHorizontal: 12, paddingBottom: 8 },
  momentWrap: { gap: spacing.xs },
  momentLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  momentRow: { gap: spacing.xs, paddingRight: spacing.sm },
  starterRow: { flexDirection: 'row', gap: spacing.xs },
  starter: { flex: 1, minHeight: 76, borderRadius: radii.medium, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 5 },
  starterSymbol: { fontSize: 22 },
  starterLabel: { color: colors.inkSoft, fontSize: 11, lineHeight: 14, fontWeight: '700', textAlign: 'center' },
  quickRail: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: 2 },
  quickCard: { width: 260, minHeight: 226, borderRadius: radii.large, backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: spacing.md, gap: spacing.xs, shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  quickTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  quickSymbol: { width: 44, height: 44, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  quickSymbolText: { fontSize: 23 },
  favoriteButton: { width: 38, height: 38, borderRadius: 15, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  favoriteButtonActive: { backgroundColor: colors.accentSoft },
  favoriteText: { color: colors.muted, fontSize: 23, lineHeight: 26 },
  favoriteTextActive: { color: colors.primary },
  quickTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '800', minHeight: 44 },
  quickSubtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, minHeight: 32 },
  quickActions: { flexDirection: 'row', gap: spacing.xs, marginTop: 'auto' },
  quickPrimary: { flex: 1, minHeight: 42, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  quickPrimaryText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  quickSecondary: { minHeight: 42, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  quickSecondaryText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  quickHint: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: spacing.xs },
  firstTime: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  firstTimeSymbol: { fontSize: 30 }, firstTimeText: { flex: 1, gap: 3 }, firstTimeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, firstTimeCopy: { color: colors.inkSoft, fontSize: 12, lineHeight: 18 },
  originalInput: { gap: spacing.sm }, originalLabel: { color: colors.primary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800' }, originalText: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  sourceNote: { gap: spacing.xs }, sourceTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, sourceText: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
