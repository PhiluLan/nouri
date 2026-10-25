import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTopBar } from '../../components/AppTopBar';
import { NouriMascot } from '../../components/NouriMascot';
import { Card, Notice, Screen, SectionHeader } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNutritionData } from '../../hooks/useNutritionData';
import { aggregateMeals, localDateKey } from '../../nutrition/engine';
import { calculateNouriHealth } from '../../nutrition/nouri-health';
import { makeRecommendations } from '../../nutrition/recommendations';
import { nutrientLabel, referencesFor } from '../../nutrition/references';
import { isPreviewMode } from '../../lib/preview';

export default function NouriScreen() {
  const { profile } = useAuth();
  const { meals, today, loading, error, refresh } = useNutritionData();
  const [greeted, setGreeted] = useState(false);
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
  const todayFoodCount = health.todayFoods;
  const tasks = [
    { key: 'hello', symbol: '✦', title: 'Nouri begrüßen', detail: 'Tippe Nouri kurz an.', done: greeted },
    { key: 'meal', symbol: '＋', title: 'Etwas festhalten', detail: today.length ? `${today.length} ${today.length === 1 ? 'Eintrag' : 'Einträge'} heute` : 'Eine Mahlzeit oder ein Getränk genügt.', done: today.length > 0 },
    { key: 'variety', symbol: '❋', title: 'Vier Farben sammeln', detail: `${Math.min(todayFoodCount, 4)} von 4 verschiedenen Lebensmitteln`, done: todayFoodCount >= 4 },
  ];
  const completed = tasks.filter((task) => task.done).length;

  function greetNouri() {
    setGreeted(true);
    if (careKey) void AsyncStorage.setItem(careKey, 'hello');
  }

  return <Screen refreshing={loading && meals.length > 0} onRefresh={() => void refresh()}>
    <AppTopBar />
    <View style={styles.heading}>
      <View>
        <Text style={styles.eyebrow}>DEIN KLEINER BEGLEITER</Text>
        <Text style={styles.title}>Klein Nouri</Text>
      </View>
      <View style={styles.streakPill}><Text style={styles.streakSymbol}>♨</Text><Text style={styles.streakText}>{health.streak} Tage</Text></View>
    </View>
    {isPreviewMode ? <Notice warning>Lokale Vorschau · Nouris Zustand basiert hier nur auf gekennzeichneten Testdaten.</Notice> : null}
    {error ? <Notice danger>{error}</Notice> : null}
    {loading && !meals.length ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Nouri wacht auf …</Text></View> : null}

    <View style={[styles.world, health.mood === 'radiant' && styles.worldRadiant]}>
      <View style={styles.sun}><View style={styles.sunCore} /></View>
      <View style={[styles.cloud, styles.cloudOne]}><View style={styles.cloudPuff} /><View style={[styles.cloudPuff, styles.cloudPuffSmall]} /></View>
      <View style={[styles.cloud, styles.cloudTwo]}><View style={styles.cloudPuff} /><View style={[styles.cloudPuff, styles.cloudPuffSmall]} /></View>
      <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>{health.moodLabel}</Text></View>
      <View style={styles.scene}>
        <View style={styles.message}><Text style={styles.messageText}>{health.message}</Text><View style={styles.messageTail} /></View>
        <NouriMascot size={208} message="Hallo! ✦" accessibilityLabel="Klein Nouri begrüßen" onInteract={greetNouri} />
      </View>
      <View style={styles.groundBack} />
      <View style={styles.ground}>
        <View style={[styles.plant, { left: '12%' }]}><View style={styles.stem} /><View style={styles.leaf} /></View>
        <View style={[styles.plant, { right: '13%' }]}><View style={styles.stem} /><View style={[styles.leaf, styles.leafRight]} /></View>
      </View>
      <View style={styles.healthPanel}>
        <View style={styles.healthTop}>
          <View><Text style={styles.healthEyebrow}>NOURI-HEALTH</Text><Text style={styles.healthLabel}>Aus deinen letzten 7 Tagen</Text></View>
          <Text style={styles.healthValue}>{health.score ?? '–'}<Text style={styles.healthOutOf}>/100</Text></Text>
        </View>
        <View style={styles.healthTrack}><View style={[styles.healthFill, { width: `${health.score ?? 0}%` }]} /></View>
      </View>
    </View>

    <Text style={styles.disclaimer}>Ein motivierender Spielwert aus deinen Einträgen – keine Aussage über deinen körperlichen Gesundheits- oder Versorgungsstatus.</Text>

    <SectionHeader title="Heute für Nouri" meta={`${completed}/3 geschafft`} />
    <Card elevated style={styles.tasksCard}>
      {tasks.map((task, index) => <Pressable
        key={task.key}
        accessibilityRole="button"
        accessibilityState={{ checked: task.done }}
        disabled={task.done || task.key === 'hello'}
        onPress={() => router.push('/(tabs)/capture')}
        style={({ pressed }) => [styles.task, index < tasks.length - 1 && styles.taskLine, pressed && styles.pressed]}
      >
        <View style={[styles.taskSymbol, task.done && styles.taskSymbolDone]}><Text style={[styles.taskSymbolText, task.done && styles.taskSymbolTextDone]}>{task.done ? '✓' : task.symbol}</Text></View>
        <View style={styles.taskCopy}><Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text><Text style={styles.taskDetail}>{task.detail}</Text></View>
        {!task.done && task.key !== 'hello' ? <Text style={styles.taskArrow}>›</Text> : null}
      </Pressable>)}
      <View style={styles.rewardRow}><Text style={styles.rewardText}>{'✦'.repeat(completed)}{'·'.repeat(3 - completed)}</Text><Text style={styles.rewardLabel}>{completed === 3 ? 'Nouris Bauchlicht ist voll!' : 'Jede kleine Pflege zählt.'}</Text></View>
    </Card>

    <SectionHeader title="Nouris Woche" meta={`${health.activeDays} aktive Tage`} />
    <Card style={styles.weekCard}>
      <View style={styles.weekRow}>{health.week.map((day) => <View key={day.date} style={styles.weekDay}>
        <View style={[styles.weekDot, day.active && styles.weekDotActive, day.today && styles.weekDotToday]}>{day.active ? <Text style={styles.weekCheck}>✓</Text> : null}</View>
        <Text style={[styles.weekLabel, day.today && styles.weekLabelToday]}>{day.today ? 'Heute' : weekday(day.date)}</Text>
      </View>)}</View>
      <View style={styles.metricDivider} />
      <Metric label="Rhythmus" detail={`${health.activeDays} von 5 Spieltagen`} value={health.rhythm} />
      <Metric label="Vielfalt" detail={`${health.uniqueFoods} verschiedene Lebensmittel`} value={health.variety} />
      <Metric label="Nährstofflicht" detail={health.nutrientBalance === null ? 'Noch zu wenig dokumentiert' : `${health.documentedSignals} verlässliche Signale`} value={health.nutrientBalance} />
    </Card>

    {wish ? <>
      <SectionHeader title="Nouris Wunsch" meta="eine Idee genügt" />
      <Card tonal style={styles.wishCard}>
        <View style={styles.wishIcon}><Text style={styles.wishIconText}>❋</Text></View>
        <View style={styles.wishCopy}>
          <Text style={styles.wishEyebrow}>{nutrientLabel(wish.nutrient)} könnte heller werden</Text>
          <Text style={styles.wishFood}>{wish.food}</Text>
          <Text style={styles.wishReason}>Eine passende Idee aus deinen heutigen, ausreichend dokumentierten Einträgen.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/capture', params: { suggestion: wish.food } })} style={({ pressed }) => [styles.wishButton, pressed && styles.pressed]}><Text style={styles.wishButtonText}>Für später merken →</Text></Pressable>
      </Card>
    </> : null}

    {health.strengths.length ? <Card style={styles.glowCard}>
      <Text style={styles.glowEyebrow}>DAS BRINGT NOURI ZUM LEUCHTEN</Text>
      <View style={styles.glowChips}>{health.strengths.map((key) => <View key={key} style={styles.glowChip}><Text style={styles.glowChipText}>✦ {nutrientLabel(key)}</Text></View>)}</View>
    </Card> : null}
  </Screen>;
}

function Metric({ label, detail, value }: { label: string; detail: string; value: number | null }) {
  return <View style={styles.metric}>
    <View style={styles.metricTop}><View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text></View><Text style={styles.metricValue}>{value === null ? 'offen' : `${value}%`}</Text></View>
    <View style={styles.metricTrack}>{value !== null ? <View style={[styles.metricFill, { width: `${value}%` }]} /> : null}</View>
  </View>;
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'narrow' });
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2, marginTop: 3 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warm, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8 },
  streakSymbol: { color: colors.warning, fontSize: 14, fontWeight: '900' },
  streakText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  loading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 13 },
  world: { minHeight: 440, borderRadius: 34, backgroundColor: '#DCEAE2', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#C8DCD0', padding: spacing.md },
  worldRadiant: { backgroundColor: '#E8EFCF' },
  sun: { position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: '#EFF4D3', top: -20, right: -12, alignItems: 'center', justifyContent: 'center' },
  sunCore: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent },
  cloud: { position: 'absolute', flexDirection: 'row', opacity: 0.46 },
  cloudOne: { top: 72, left: 24 },
  cloudTwo: { top: 120, right: 18, transform: [{ scale: 0.72 }] },
  cloudPuff: { width: 48, height: 20, borderRadius: 14, backgroundColor: colors.white },
  cloudPuffSmall: { width: 30, marginLeft: -10, marginTop: -8 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 7, zIndex: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  scene: { minHeight: 250, alignItems: 'center', justifyContent: 'flex-end', zIndex: 3 },
  message: { position: 'absolute', top: 22, left: 6, maxWidth: 156, backgroundColor: colors.surfaceRaised, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, zIndex: 6, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  messageText: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  messageTail: { position: 'absolute', width: 12, height: 12, right: -5, bottom: 10, backgroundColor: colors.surfaceRaised, transform: [{ rotate: '45deg' }] },
  groundBack: { position: 'absolute', left: -30, right: -30, top: 255, height: 120, borderRadius: 80, backgroundColor: '#C6DDBA' },
  ground: { position: 'absolute', left: -40, right: -40, top: 300, height: 90, borderRadius: 70, backgroundColor: '#AFCB9E' },
  plant: { position: 'absolute', top: 12, width: 28, height: 40 },
  stem: { position: 'absolute', width: 3, height: 30, backgroundColor: colors.primary, left: 13, bottom: 0, borderRadius: 3 },
  leaf: { position: 'absolute', width: 16, height: 10, borderRadius: 12, backgroundColor: colors.primary, left: 0, top: 7, transform: [{ rotate: '28deg' }] },
  leafRight: { left: 14, transform: [{ rotate: '-28deg' }] },
  healthPanel: { marginTop: 4, zIndex: 6, backgroundColor: 'rgba(255,253,248,0.92)', borderRadius: 22, padding: 14, gap: 10 },
  healthTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  healthEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  healthLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  healthValue: { color: colors.ink, fontSize: 24, lineHeight: 27, fontWeight: '900' },
  healthOutOf: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  healthTrack: { height: 11, borderRadius: radii.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  healthFill: { height: '100%', minWidth: 3, borderRadius: radii.pill, backgroundColor: colors.accent },
  disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 15, paddingHorizontal: spacing.xs },
  tasksCard: { padding: 0, overflow: 'hidden', gap: 0 },
  task: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  taskLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  taskSymbol: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  taskSymbolDone: { backgroundColor: colors.primary },
  taskSymbolText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  taskSymbolTextDone: { color: colors.accent },
  taskCopy: { flex: 1 },
  taskTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  taskTitleDone: { color: colors.muted },
  taskDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  taskArrow: { color: colors.primary, fontSize: 24, fontWeight: '400' },
  rewardRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.accentSoft },
  rewardText: { color: colors.primary, fontSize: 17, letterSpacing: 3, fontWeight: '900' },
  rewardLabel: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', flex: 1 },
  weekCard: { gap: spacing.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  weekDotActive: { backgroundColor: colors.accent },
  weekDotToday: { borderWidth: 2, borderColor: colors.primary },
  weekCheck: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  weekLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  weekLabelToday: { color: colors.primary, fontWeight: '900' },
  metricDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  metric: { gap: 7 },
  metricTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  metricLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  metricDetail: { color: colors.muted, fontSize: 10, marginTop: 2 },
  metricValue: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  metricTrack: { height: 8, borderRadius: radii.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  metricFill: { height: '100%', minWidth: 3, borderRadius: radii.pill, backgroundColor: colors.primary },
  wishCard: { padding: spacing.lg, gap: spacing.md },
  wishIcon: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  wishIconText: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  wishCopy: { gap: 4 },
  wishEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  wishFood: { color: colors.ink, fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.6 },
  wishReason: { color: colors.inkSoft, fontSize: 12, lineHeight: 18 },
  wishButton: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 11 },
  wishButtonText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  glowCard: { gap: spacing.sm },
  glowEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  glowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  glowChip: { backgroundColor: colors.accentSoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7 },
  glowChipText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.68, transform: [{ scale: 0.99 }] },
});
