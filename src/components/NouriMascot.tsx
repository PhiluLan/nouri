import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from './theme';

interface NouriMascotProps {
  size?: number;
  message?: string;
  accessibilityLabel?: string;
  onInteract?: () => void;
}

export function NouriMascot({ size = 112, message = 'Bereit! ✦', accessibilityLabel = 'Klein nouri begrüßen', onInteract }: NouriMascotProps) {
  const useNativeDriver = Platform.OS !== 'web';
  const [float] = useState(() => new Animated.Value(0));
  const [sway] = useState(() => new Animated.Value(0));
  const [reaction] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0.35));
  const [reduceMotion, setReduceMotion] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const idle = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1650, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(float, { toValue: 0, duration: 1650, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(sway, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.72, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(glow, { toValue: 0.35, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
    ]));
    idle.start();
    return () => idle.stop();
  }, [float, glow, reduceMotion, sway, useNativeDriver]);

  useEffect(() => () => {
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
  }, []);

  function react() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onInteract?.();
    setGreetingVisible(true);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    greetingTimer.current = setTimeout(() => setGreetingVisible(false), 2200);
    if (reduceMotion) return;
    reaction.stopAnimation();
    reaction.setValue(0);
    Animated.sequence([
      Animated.spring(reaction, { toValue: 1, friction: 4, tension: 145, useNativeDriver }),
      Animated.spring(reaction, { toValue: 0, friction: 5, tension: 85, useNativeDriver }),
    ]).start();
  }

  const translateY = Animated.add(
    float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
    reaction.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, -12, 1] }),
  );
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const scale = reaction.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 0.96] });

  return <View style={[styles.stage, { width: size + 18, height: size + 24 }]}>
    {greetingVisible ? <View accessibilityLiveRegion="polite" style={styles.bubble}><Text style={styles.bubbleText}>{message}</Text></View> : null}
    <Animated.View style={[styles.shadow, { width: size * 0.48 }, { opacity: float.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.08] }), transform: [{ scaleX: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) }] }]} />
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={react} style={styles.touchTarget}>
      <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { rotate }, { scale }] }}>
        <Animated.View pointerEvents="none" style={[styles.aura, { width: size * 0.26, height: size * 0.31, left: size * 0.405, top: size * 0.59, opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0.35, 0.72], outputRange: [0.88, 1.12] }) }] }]} />
        <Animated.Image source={require('../../assets/mascot/nouri-idle.png')} resizeMode="contain" style={{ width: size, height: size }} />
      </Animated.View>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  touchTarget: { alignItems: 'center', justifyContent: 'center' },
  shadow: { position: 'absolute', bottom: 1, height: 8, borderRadius: radii.pill, backgroundColor: colors.primary },
  aura: { position: 'absolute', zIndex: 2, borderRadius: radii.pill, backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.65, shadowRadius: 9, elevation: 3 },
  bubble: { position: 'absolute', zIndex: 5, top: -6, right: -10, backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  bubbleText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
});
