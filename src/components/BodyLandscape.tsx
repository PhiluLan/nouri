import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { bodyRegions, type BodyRegionKey } from '../nutrition/body-regions';
import { colors, radii } from './theme';

const positions: Record<BodyRegionKey, ViewStyle> = {
  brain: { left: 4, top: 24 }, eyes: { right: 4, top: 66 },
  heart: { left: 4, top: 137 }, blood: { right: 4, top: 157 },
  digestion: { left: 4, top: 227 }, immune: { right: 4, top: 247 },
  muscles: { left: 4, top: 324 }, bones: { right: 4, top: 342 },
  skin: { left: '50%', bottom: 8, transform: [{ translateX: -47 }] },
};

export function BodyLandscape({ selected, onSelect }: { selected: BodyRegionKey; onSelect: (key: BodyRegionKey) => void }) {
  const skin = selected === 'skin';
  const headActive = selected === 'brain' || selected === 'eyes' || skin;
  const torsoActive = ['heart', 'blood', 'digestion', 'immune', 'skin'].includes(selected);
  const limbActive = selected === 'muscles' || selected === 'bones' || skin;
  return <View style={styles.canvas}>
    <View style={styles.halo} />
    <View style={styles.figure}>
      <View style={[styles.head, headActive && styles.figureActive]}>
        <View style={styles.eyeRow}><View style={styles.eye} /><View style={styles.eye} /></View>
      </View>
      <View style={[styles.neck, torsoActive && styles.figureActive]} />
      <View style={[styles.torso, torsoActive && styles.figureActive]} />
      <View style={[styles.heart, selected === 'heart' && styles.hotspotActive]}><Text style={styles.heartText}>♥</Text></View>
      <View style={[styles.belly, selected === 'digestion' && styles.hotspotActive]}><Text style={styles.bellyText}>≈</Text></View>
      <View style={[styles.arm, styles.armLeft, limbActive && styles.figureActive]} />
      <View style={[styles.arm, styles.armRight, limbActive && styles.figureActive]} />
      <View style={[styles.hips, (torsoActive || limbActive) && styles.figureActive]} />
      <View style={[styles.leg, styles.legLeft, limbActive && styles.figureActive]} />
      <View style={[styles.leg, styles.legRight, limbActive && styles.figureActive]} />
      <View style={[styles.foot, styles.footLeft, limbActive && styles.figureActive]} /><View style={[styles.foot, styles.footRight, limbActive && styles.figureActive]} />
    </View>

    {bodyRegions.map((region) => <Pressable key={region.key} accessibilityRole="button" accessibilityState={{ selected: selected === region.key }} onPress={() => onSelect(region.key)} style={({ pressed }) => [styles.regionButton, positions[region.key], selected === region.key && styles.regionButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.regionSymbol, selected === region.key && styles.regionSymbolActive]}>{region.symbol}</Text><Text style={[styles.regionLabel, selected === region.key && styles.regionLabelActive]}>{region.shortLabel}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  canvas: { height: 448, borderRadius: 30, backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  halo: { position: 'absolute', width: 220, height: 370, left: '50%', top: 32, marginLeft: -110, borderRadius: 110, backgroundColor: '#F0F5EC' },
  figure: { position: 'absolute', width: 126, height: 414, left: '50%', top: 15, marginLeft: -63 },
  head: { position: 'absolute', left: 34, top: 0, width: 58, height: 72, borderRadius: 30, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  eyeRow: { flexDirection: 'row', gap: 13, marginTop: 5 },
  eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  neck: { position: 'absolute', top: 65, left: 51, width: 24, height: 31, backgroundColor: '#D9E7DF' },
  torso: { position: 'absolute', top: 86, left: 22, width: 82, height: 145, borderTopLeftRadius: 35, borderTopRightRadius: 35, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white },
  arm: { position: 'absolute', top: 96, width: 24, height: 158, borderRadius: 15, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white },
  armLeft: { left: 7, transform: [{ rotate: '7deg' }] },
  armRight: { right: 7, transform: [{ rotate: '-7deg' }] },
  hips: { position: 'absolute', top: 218, left: 30, width: 66, height: 45, borderRadius: 20, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white },
  leg: { position: 'absolute', top: 246, width: 29, height: 143, borderRadius: 17, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white },
  legLeft: { left: 31, transform: [{ rotate: '2deg' }] },
  legRight: { right: 31, transform: [{ rotate: '-2deg' }] },
  foot: { position: 'absolute', top: 382, width: 40, height: 20, borderRadius: 12, backgroundColor: '#D9E7DF', borderWidth: 2, borderColor: colors.white },
  footLeft: { left: 22 }, footRight: { right: 22 },
  figureActive: { backgroundColor: colors.accent },
  heart: { position: 'absolute', top: 121, left: 38, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  heartText: { color: colors.danger, fontSize: 15 },
  belly: { position: 'absolute', top: 174, left: 47, width: 29, height: 29, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  bellyText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  hotspotActive: { backgroundColor: colors.accentSoft, transform: [{ scale: 1.12 }] },
  regionButton: { position: 'absolute', minWidth: 94, height: 38, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 9, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  regionButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  regionSymbol: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  regionSymbolActive: { color: colors.accent },
  regionLabel: { color: colors.inkSoft, fontSize: 10, fontWeight: '800' },
  regionLabelActive: { color: colors.white },
  pressed: { opacity: 0.65 },
});
