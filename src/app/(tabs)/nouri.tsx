import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { NouriHabitat } from '../../components/NouriHabitat';
import { Card, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals, localDateKey } from '../../nutrition/engine';
import { calculateNouriHealth, type NouriHealthSnapshot } from '../../nutrition/nouri-health';
import { makeRecommendations } from '../../nutrition/recommendations';
import { nutrientLabel, referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function NouriScreen() {
  const { profile } = useAuth();
  const { meals, today, loading, error, refresh } = useNutritionData();
  const [greeted, setGreeted] = useState(false);
  const [showLogic, setShowLogic] = useState(false);
  const todayKey = localDateKey(new Date());
  const careKey = profile ? `nouri-care-v1:${profile.id}:${todayKey}` : null;

  useEffect(() => {
    if (!careKey) return;
    void AsyncStorage.getItem(careKey).then((value) => setGreeted(value === 'hello'));
  }, [careKey]);

  if (!profile) return null;
  const references = referencesFor(profile);
  const health = calculateNouriHealth(meals, references);
  const wish = makeRecommendations(aggregateMeals(today), references, profile)[0];
  const tasks = dailyTasks(health, today.length, greeted);
  const completed = tasks.filter((task) => task.done).length;
  const garden = gardenStage(health, completed);
  const collectibles = gardenCollectibles(health, meals.length);

  function greetNouri() {
    setGreeted(true);
    if (careKey) void AsyncStorage.setItem(careKey, 'hello');
  }

  return <Screen refreshing={loading && meals.length > 0} onRefresh={() => void refresh()}>
    <AppTopBar />
    <View style={styles.heading}>
      <View><Text style={styles.eyebrow}>DEINE KLEINE WELT</Text><Text style={styles.title}>Nouris Garten</Text></View>
      <View style={styles.streak}><Text style={styles.streakFlame}>♨</Text><View><Text style={styles.streakValue}>{health.streak}</Text><Text style={styles.streakLabel}>{health.streak === 1 ? 'Tag' : 'Tage'}</Text></View></View>
    </View>
    {isPreviewMode ? <View style={styles.previewPill}><View style={styles.previewDot} /><Text style={styles.previewText}>Vorschau mit Testdaten</Text></View> : null}
    {error ? <Notice danger>{error}</Notice> : null}
    {loading && !meals.length ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Nouris Welt erwacht …</Text></View> : null}

    <NouriHabitat score={health.score} moodLabel={health.moodLabel} message={health.message} completed={completed} level={garden.level} levelName={garden.name} glowLabels={health.strengths.map(nutrientLabel)} onInteract={greetNouri} />

    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showLogic }} onPress={() => setShowLogic((value) => !value)} style={({ pressed }) => [styles.logicButton, pressed && styles.pressed]}>
      <View style={styles.infoCircle}><Text style={styles.infoText}>i</Text></View>
      <View style={styles.logicCopy}><Text style={styles.logicTitle}>Was bedeutet Nouris Aura?</Text><Text style={styles.logicMeta}>Spielwert, keine Gesundheitsbewertung</Text></View>
      <Text style={styles.logicArrow}>{showLogic ? '↑' : '↓'}</Text>
    </Pressable>
    {showLogic ? <Card tonal style={styles.logicCard}><Text style={styles.logicBody}>Die Aura verbindet deinen Erfassungsrhythmus, verschiedene Lebensmittel und nur ausreichend dokumentierte Nährstoffsignale der letzten sieben Tage.</Text><Text style={styles.logicFoot}>Fehlende Werte bleiben unbekannt und verschlechtern Nouris Aura nicht. Sie sagt nichts über deinen körperlichen Versorgungsstatus aus.</Text></Card> : null}

    {wish ? <View style={styles.wish}>
      <View style={styles.wishGlow} />
      <View style={styles.wishTop}><View style={styles.wishOrb}><Text style={styles.wishOrbText}>✦</Text></View><Text style={styles.wishEyebrow}>NOURIS NÄCHSTER LICHTMOMENT</Text></View>
      <Text style={styles.wishFood}>{wish.food}</Text>
      <Text style={styles.wishReason}>{nutrientLabel(wish.nutrient)} ist heute bislang eher niedrig erfasst. Diese Idee passt dazu.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/capture', params: { suggestion: wish.food } })} style={({ pressed }) => [styles.wishAction, pressed && styles.pressed]}><Text style={styles.wishActionText}>Als Idee übernehmen</Text><Text style={styles.wishActionArrow}>→</Text></Pressable>
    </View> : null}

    <SectionHeader title="Euer Ritual" meta={`${completed}/3 heute`} />
    <Card elevated style={styles.ritualCard}>
      <View style={styles.ritualIntro}><View><Text style={styles.ritualEyebrow}>KLEIN, ECHT, MACHBAR</Text><Text style={styles.ritualTitle}>{completed === 3 ? 'Nouri leuchtet für heute.' : 'Noch ein kleiner Moment.'}</Text></View><Text style={styles.ritualFraction}>{completed}<Text style={styles.ritualOutOf}>/3</Text></Text></View>
      <View style={styles.ritualProgress}>{[0, 1, 2].map((index) => <View key={index} style={[styles.ritualSegment, index < completed && styles.ritualSegmentDone]} />)}</View>
      {tasks.map((task, index) => <Pressable key={task.key} accessibilityRole="button" accessibilityState={{ checked: task.done }} disabled={task.done || task.key === 'hello'} onPress={() => router.push('/(tabs)/capture')} style={({ pressed }) => [styles.task, index < tasks.length - 1 && styles.taskLine, pressed && styles.pressed]}>
        <View style={[styles.taskMark, task.done && styles.taskMarkDone]}><Text style={[styles.taskMarkText, task.done && styles.taskMarkTextDone]}>{task.done ? '✓' : task.symbol}</Text></View>
        <View style={styles.taskCopy}><Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text><Text style={styles.taskDetail}>{task.detail}</Text></View>
        {!task.done && task.key !== 'hello' ? <View style={styles.taskGo}><Text style={styles.taskGoText}>→</Text></View> : null}
      </Pressable>)}
    </Card>

    <SectionHeader title="Dein Garten wächst" meta={`Stufe ${garden.level} von 5`} />
    <Card style={styles.gardenCard}>
      <View style={styles.gardenTop}><View><Text style={styles.gardenName}>{garden.name}</Text><Text style={styles.gardenCopy}>{garden.copy}</Text></View><View style={styles.levelStamp}><Text style={styles.levelStampText}>{garden.level}</Text></View></View>
      <View style={styles.gardenTrack}><View style={[styles.gardenFill, { width: `${garden.progress}%` }]} /></View>
      <Text style={styles.gardenNext}>{garden.level === 5 ? 'Deine Wochenwelt ist vollständig entfaltet.' : `Noch ${garden.remaining} Lichtpunkte bis zur nächsten Gartenstufe.`}</Text>
      <View style={styles.collectionGrid}>{collectibles.map((item) => <View key={item.name} style={[styles.collectible, !item.unlocked && styles.collectibleLocked]}>
        <View style={[styles.collectibleIcon, item.unlocked && styles.collectibleIconUnlocked]}><Text style={[styles.collectibleSymbol, !item.unlocked && styles.collectibleSymbolLocked]}>{item.unlocked ? item.symbol : '·'}</Text></View>
        <Text style={[styles.collectibleName, !item.unlocked && styles.collectibleNameLocked]}>{item.name}</Text>
        <Text style={styles.collectibleHint}>{item.unlocked ? 'Im Garten' : item.hint}</Text>
      </View>)}</View>
    </Card>

    <SectionHeader title="Nouris Puls" meta="letzte 7 Tage" />
    <View style={styles.pulseCard}>
      <View style={styles.weekRow}>{health.week.map((day) => <View key={day.date} style={styles.weekDay}><View style={[styles.weekDot, day.active && styles.weekDotActive, day.today && styles.weekDotToday]}>{day.active ? <Text style={styles.weekCheck}>✦</Text> : null}</View><Text style={[styles.weekLabel, day.today && styles.weekLabelToday]}>{day.today ? 'Heute' : weekday(day.date)}</Text></View>)}</View>
      <View style={styles.pulseDivider} />
      <Metric label="Rhythmus" detail={`${health.activeDays} von 5 sanften Spieltagen`} value={health.rhythm} />
      <Metric label="Vielfalt" detail={`${health.uniqueFoods} verschiedene Lebensmittel`} value={health.variety} />
      <Metric label="Nährstofflicht" detail={health.nutrientBalance === null ? 'Noch nicht ausreichend dokumentiert' : `${health.documentedSignals} verlässliche Signale`} value={health.nutrientBalance} />
    </View>
  </Screen>;
}

function dailyTasks(health: NouriHealthSnapshot, todayMeals: number, greeted: boolean) {
  return [
    { key: 'hello', symbol: '✦', title: 'Einmal Hallo sagen', detail: greeted ? 'Nouri hat sich gefreut.' : 'Streichle Nouri in seinem Garten.', done: greeted },
    { key: 'meal', symbol: '＋', title: 'Etwas Echtes festhalten', detail: todayMeals ? `${todayMeals} ${todayMeals === 1 ? 'Eintrag' : 'Einträge'} heute` : 'Eine Mahlzeit oder ein Getränk genügt.', done: todayMeals > 0 },
    { key: 'variety', symbol: '❋', title: 'Vier Farben entdecken', detail: `${Math.min(health.todayFoods, 4)} von 4 verschiedenen Lebensmitteln`, done: health.todayFoods >= 4 },
  ];
}

function gardenStage(health: NouriHealthSnapshot, completed: number) {
  const points = health.activeDays * 3 + Math.min(health.uniqueFoods, 12) + health.strengths.length * 2 + completed;
  const thresholds = [0, 7, 15, 24, 34, 46];
  const stages = [['Erster Keim', 'Nouri richtet sich vorsichtig ein.'], ['Mooswinkel', 'Die ersten weichen Plätze entstehen.'], ['Lichtgarten', 'Kleine Lichtpunkte ziehen in den Garten.'], ['Blätterhain', 'Vielfalt lässt die Welt dichter werden.'], ['Nouri-Oase', 'Die ganze Wochenwelt ist lebendig.']] as const;
  const level = Math.min(5, thresholds.slice(1).filter((threshold) => points >= threshold).length + 1);
  const start = thresholds[level - 1];
  const end = thresholds[level] ?? start;
  const progress = level === 5 ? 100 : Math.round((points - start) / (end - start) * 100);
  return { level, name: stages[level - 1][0], copy: stages[level - 1][1], progress, remaining: Math.max(0, end - points) };
}

function gardenCollectibles(health: NouriHealthSnapshot, mealCount: number) {
  return [
    { name: 'Moosinsel', symbol: '●', unlocked: mealCount > 0, hint: 'Ersten Eintrag erfassen' },
    { name: 'Lichtfunken', symbol: '✦', unlocked: health.activeDays >= 2, hint: 'An 2 Tagen erfassen' },
    { name: 'Blütenpfad', symbol: '❋', unlocked: health.uniqueFoods >= 8, hint: '8 Lebensmittel entdecken' },
    { name: 'Aurastein', symbol: '◈', unlocked: health.strengths.length >= 2, hint: '2 Nährstofflichter stärken' },
  ];
}

function Metric({ label, detail, value }: { label: string; detail: string; value: number | null }) {
  return <View style={styles.metric}><View style={styles.metricTop}><View style={styles.metricCopy}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text></View><Text style={styles.metricValue}>{value === null ? 'offen' : `${value}%`}</Text></View><View style={styles.metricTrack}>{value !== null ? <View style={[styles.metricFill, { width: `${value}%` }]} /> : null}</View></View>;
}

function weekday(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'narrow' }); }

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.25, marginTop: 3 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.warm, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  streakFlame: { color: colors.warning, fontSize: 15, fontWeight: '900' },
  streakValue: { color: colors.ink, fontSize: 14, lineHeight: 15, fontWeight: '900' },
  streakLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  previewPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.warm, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  previewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  previewText: { color: colors.inkSoft, fontSize: 9, fontWeight: '800' },
  loading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 13 },
  logicButton: { minHeight: 62, borderRadius: radii.medium, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  infoCircle: { width: 32, height: 32, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.primary, fontSize: 14, fontWeight: '900', fontFamily: 'Georgia' },
  logicCopy: { flex: 1 },
  logicTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  logicMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
  logicArrow: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  logicCard: { gap: spacing.xs },
  logicBody: { color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  logicFoot: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  wish: { position: 'relative', overflow: 'hidden', borderRadius: 30, backgroundColor: colors.primary, padding: spacing.lg, gap: spacing.sm },
  wishGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(201,219,120,0.12)', top: -75, right: -45 },
  wishTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wishOrb: { width: 38, height: 38, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  wishOrbText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  wishEyebrow: { color: '#DCE9E3', fontSize: 9, fontWeight: '900', letterSpacing: 1, flex: 1 },
  wishFood: { color: colors.white, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 },
  wishReason: { color: '#D7E5DF', fontSize: 12, lineHeight: 18, maxWidth: 300 },
  wishAction: { marginTop: spacing.xs, minHeight: 46, borderRadius: radii.pill, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  wishActionText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  wishActionArrow: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  ritualCard: { padding: 0, overflow: 'hidden', gap: 0 },
  ritualIntro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: spacing.sm },
  ritualEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  ritualTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '900', marginTop: 3 },
  ritualFraction: { color: colors.primary, fontSize: 25, fontWeight: '900' },
  ritualOutOf: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  ritualProgress: { flexDirection: 'row', gap: 5, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  ritualSegment: { height: 5, flex: 1, borderRadius: radii.pill, backgroundColor: colors.primarySoft },
  ritualSegmentDone: { backgroundColor: colors.accent },
  task: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  taskLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  taskMark: { width: 39, height: 39, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  taskMarkDone: { backgroundColor: colors.primary },
  taskMarkText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  taskMarkTextDone: { color: colors.accent },
  taskCopy: { flex: 1 },
  taskTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  taskTitleDone: { color: colors.muted },
  taskDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  taskGo: { width: 31, height: 31, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  taskGoText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  gardenCard: { padding: spacing.lg, gap: spacing.md },
  gardenTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  gardenName: { color: colors.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  gardenCopy: { color: colors.muted, fontSize: 11, marginTop: 3 },
  levelStamp: { width: 49, height: 49, borderRadius: 18, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  levelStampText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  gardenTrack: { height: 9, borderRadius: radii.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  gardenFill: { height: '100%', minWidth: 3, borderRadius: radii.pill, backgroundColor: colors.accent },
  gardenNext: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  collectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  collectible: { width: '48.3%', minHeight: 108, borderRadius: 20, backgroundColor: colors.accentSoft, padding: 12, justifyContent: 'space-between' },
  collectibleLocked: { backgroundColor: '#F1F1EB' },
  collectibleIcon: { width: 34, height: 34, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  collectibleIconUnlocked: { backgroundColor: colors.primary },
  collectibleSymbol: { color: colors.accent, fontSize: 15, fontWeight: '900' },
  collectibleSymbolLocked: { color: colors.lineStrong },
  collectibleName: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 8 },
  collectibleNameLocked: { color: colors.muted },
  collectibleHint: { color: colors.muted, fontSize: 8, lineHeight: 12, marginTop: 2 },
  pulseCard: { borderRadius: 30, backgroundColor: '#123D31', padding: spacing.lg, gap: spacing.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#28594B', alignItems: 'center', justifyContent: 'center' },
  weekDotActive: { backgroundColor: colors.accent },
  weekDotToday: { borderWidth: 2, borderColor: colors.white },
  weekCheck: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  weekLabel: { color: '#AFC6BD', fontSize: 8, fontWeight: '800' },
  weekLabelToday: { color: colors.white },
  pulseDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#38685A' },
  metric: { gap: 7 },
  metricTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  metricCopy: { flex: 1 },
  metricLabel: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metricDetail: { color: '#AFC6BD', fontSize: 9, marginTop: 2 },
  metricValue: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  metricTrack: { height: 7, borderRadius: radii.pill, backgroundColor: '#28594B', overflow: 'hidden' },
  metricFill: { height: '100%', minWidth: 3, borderRadius: radii.pill, backgroundColor: colors.accent },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
});
