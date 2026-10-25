import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { NouriMascot } from './NouriMascot';
import { colors, radii, spacing } from './theme';

interface NouriHabitatProps {
  score: number | null;
  moodLabel: string;
  message: string;
  completed: number;
  level: number;
  levelName: string;
  glowLabels: string[];
  onInteract: () => void;
}

const burstVectors = [
  [-74, -92], [-35, -122], [18, -132], [62, -102], [88, -58], [-88, -48],
];

export function NouriHabitat({ score, moodLabel, message, completed, level, levelName, glowLabels, onInteract }: NouriHabitatProps) {
  const useNativeDriver = Platform.OS !== 'web';
  const [drift] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => { void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const ambient = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(drift, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
    ]));
    ambient.start();
    return () => ambient.stop();
  }, [drift, pulse, reduceMotion, useNativeDriver]);

  function celebrate() {
    onInteract();
    if (reduceMotion) return;
    burst.stopAnimation();
    burst.setValue(0);
    Animated.sequence([
      Animated.timing(burst, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.timing(burst, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver }),
    ]).start();
  }

  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.09] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.42] });

  return <ImageBackground
    source={require('../../assets/mascot/nouri-habitat-v2.jpg')}
    resizeMode="cover"
    imageStyle={styles.image}
    style={styles.habitat}
  >
    <View style={styles.wash} />
    <View style={styles.topRow}>
      <View style={styles.glassPill}><View style={styles.liveDot} /><Text style={styles.glassText}>{moodLabel}</Text></View>
      <View style={styles.levelPill}><Text style={styles.levelNumber}>{level}</Text><View><Text style={styles.levelEyebrow}>GARTENSTUFE</Text><Text style={styles.levelText}>{levelName}</Text></View></View>
    </View>

    <View style={styles.speech}><Text style={styles.speechText}>{message}</Text><View style={styles.speechTail} /></View>

    <Animated.View pointerEvents="none" style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
    {glowLabels.slice(0, 3).map((label, index) => <Animated.View
      key={label}
      pointerEvents="none"
      style={[
        styles.orb,
        index === 0 ? styles.orbOne : index === 1 ? styles.orbTwo : styles.orbThree,
        { transform: [{ translateY: index % 2 ? Animated.multiply(driftY, -0.7) : driftY }] },
      ]}
    ><Text style={styles.orbText}>{shortLabel(label)}</Text></Animated.View>)}

    <View style={styles.character}>
      <NouriMascot size={222} message="Das kitzelt! ✦" accessibilityLabel="Klein Nouri streicheln" onInteract={celebrate} />
      {burstVectors.map(([x, y], index) => <Animated.View key={`${x}-${y}`} pointerEvents="none" style={[
        styles.burst,
        { backgroundColor: index % 2 ? colors.white : colors.accent, opacity: burst.interpolate({ inputRange: [0, 0.1, 0.76, 1], outputRange: [0, 1, 0.75, 0] }), transform: [
          { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
          { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
          { scale: burst.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.3, 1.2, 0.5] }) },
        ] },
      ]} />)}
    </View>

    <View style={styles.auraPanel}>
      <View style={styles.auraTop}>
        <View><Text style={styles.auraEyebrow}>NOURIS AURA</Text><Text style={styles.auraMeta}>Aus deinen letzten 7 Tagen</Text></View>
        <Text style={styles.score}>{score ?? '–'}<Text style={styles.scoreUnit}>/100</Text></Text>
      </View>
      <View style={styles.auraTrack}><View style={[styles.auraFill, { width: `${score ?? 0}%` }]} /></View>
      <View style={styles.ritualRow}>
        <Text style={styles.ritualLabel}>Heutiges Ritual</Text>
        <View style={styles.sparkRow}>{[0, 1, 2].map((index) => <View key={index} style={[styles.spark, index < completed && styles.sparkDone]}><Text style={[styles.sparkText, index < completed && styles.sparkTextDone]}>✦</Text></View>)}</View>
        <Text style={styles.ritualCount}>{completed}/3</Text>
      </View>
    </View>
  </ImageBackground>;
}

function shortLabel(label: string) {
  if (label === 'Vitamin C') return 'C';
  if (label === 'Vitamin B12') return 'B₁₂';
  if (label === 'Vitamin D') return 'D';
  if (label === 'Nahrungsfasern') return 'F';
  return label.slice(0, 2);
}

const styles = StyleSheet.create({
  habitat: { height: 524, borderRadius: 34, overflow: 'hidden', padding: spacing.md, justifyContent: 'space-between', shadowColor: '#0E392D', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 7 },
  image: { borderRadius: 34 },
  wash: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(13,49,38,0.05)' },
  topRow: { zIndex: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  glassPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.primary },
  glassText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,64,50,0.9)', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7 },
  levelNumber: { width: 28, height: 28, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, color: colors.primary, fontSize: 14, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
  levelEyebrow: { color: '#CFE0D8', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  levelText: { color: colors.white, fontSize: 10, fontWeight: '800', marginTop: 1 },
  speech: { position: 'absolute', zIndex: 9, top: 88, left: 18, maxWidth: 160, borderRadius: 20, borderBottomRightRadius: 7, backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 13, paddingVertical: 11, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  speechText: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  speechTail: { position: 'absolute', width: 13, height: 13, right: -5, bottom: 3, backgroundColor: colors.white, transform: [{ rotate: '45deg' }] },
  halo: { position: 'absolute', zIndex: 2, width: 210, height: 210, borderRadius: 105, left: '50%', marginLeft: -105, top: 176, backgroundColor: colors.accent },
  character: { position: 'absolute', zIndex: 5, top: 138, left: 0, right: 0, alignItems: 'center' },
  orb: { position: 'absolute', zIndex: 7, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(230,247,124,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', shadowColor: colors.accent, shadowOpacity: 0.8, shadowRadius: 10 },
  orbOne: { top: 182, left: 36 },
  orbTwo: { top: 250, right: 28 },
  orbThree: { top: 313, left: 44, transform: [{ scale: 0.84 }] },
  orbText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  burst: { position: 'absolute', zIndex: 10, width: 10, height: 10, borderRadius: 5, top: 132, left: '50%', marginLeft: -5 },
  auraPanel: { zIndex: 8, marginTop: 'auto', borderRadius: 23, backgroundColor: 'rgba(255,253,248,0.94)', padding: 14, gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  auraTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  auraEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  auraMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  score: { color: colors.ink, fontSize: 26, lineHeight: 28, fontWeight: '900' },
  scoreUnit: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  auraTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  auraFill: { height: '100%', minWidth: 3, backgroundColor: colors.accent, borderRadius: radii.pill },
  ritualRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ritualLabel: { color: colors.inkSoft, fontSize: 9, fontWeight: '800', flex: 1 },
  sparkRow: { flexDirection: 'row', gap: 5 },
  spark: { width: 20, height: 20, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sparkDone: { backgroundColor: colors.primary },
  sparkText: { color: colors.lineStrong, fontSize: 9, fontWeight: '900' },
  sparkTextDone: { color: colors.accent },
  ritualCount: { color: colors.primary, fontSize: 10, fontWeight: '900' },
});
