import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, Button, Card, Chip, Field, Heading, Notice, Screen, textStyles } from '../components/ui';
import { colors, radii, spacing } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const dietOptions = [
  ['vegetarian', 'Vegetarisch'], ['vegan', 'Vegan'], ['lactose_free', 'Laktosefrei'],
  ['dairy_free', 'Milchfrei'], ['gluten_free', 'Glutenfrei'], ['fish_free', 'Ohne Fisch'],
] as const;

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState('1990');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState<'female' | 'male' | 'other' | 'prefer_not'>('prefer_not');
  const [pregnant, setPregnant] = useState(false);
  const [breastfeeding, setBreastfeeding] = useState(false);
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [busy, setBusy] = useState(false);
  const parsedYear = Number(birthYear);
  const valid = useMemo(() => parsedYear >= 1900 && parsedYear <= new Date().getFullYear() - 18, [parsedYear]);

  function toggle(tag: string) {
    setDiet((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function save() {
    if (!session || !valid) return Alert.alert('Geburtsjahr prüfen', 'nouri MVP ist für Erwachsene ab 18 Jahren ausgelegt.');
    const weightValue = weight.trim() ? Number(weight.replace(',', '.')) : null;
    if (weightValue !== null && (weightValue < 30 || weightValue > 300)) return Alert.alert('Gewicht prüfen', 'Bitte gib ein plausibles Gewicht zwischen 30 und 300 kg ein oder lasse das Feld leer.');
    setBusy(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      birth_year: parsedYear,
      sex,
      weight_kg: weightValue,
      pregnant: sex === 'female' && pregnant,
      breastfeeding: sex === 'female' && breastfeeding,
      diet,
      allergies: allergies.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean),
      reference_source: 'BLV Schweizer Referenzwerte für die Nährstoffzufuhr',
      reference_version: '2026-02-10',
      onboarded_at: new Date().toISOString(),
    });
    try {
      if (error) throw error;
      await refreshProfile();
      router.replace('/(tabs)/capture');
    } catch (cause) {
      Alert.alert('Speichern nicht möglich', cause instanceof Error ? cause.message : 'Unbekannter Fehler');
    } finally {
      setBusy(false);
    }
  }

  return <Screen>
    <View style={styles.top}><BrandMark /><Text style={styles.step}>{step + 1} von 3</Text></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>

    {step === 0 ? <>
      <Heading eyebrow="Persönliche Grundlage" title="Welche Werte passen zu dir?">Alter, Referenzgruppe und optional dein Gewicht helfen uns, geeignete fachliche Referenzwerte auszuwählen.</Heading>
      <Card elevated>
        <Field label="Geburtsjahr" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />
        <Field label="Gewicht in kg (optional)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Für die Protein-Referenz" />
        <Text style={textStyles.label}>Referenzgruppe</Text>
        <View style={styles.wrap}>
          <Chip label="Weiblich" selected={sex === 'female'} onPress={() => setSex('female')} />
          <Chip label="Männlich" selected={sex === 'male'} onPress={() => setSex('male')} />
          <Chip label="Divers" selected={sex === 'other'} onPress={() => setSex('other')} />
          <Chip label="Keine Angabe" selected={sex === 'prefer_not'} onPress={() => setSex('prefer_not')} />
        </View>
        {sex === 'female' ? <View style={styles.wrap}>
          <Chip label="Schwanger" selected={pregnant} onPress={() => { setPregnant(!pregnant); setBreastfeeding(false); }} />
          <Chip label="Stillend" selected={breastfeeding} onPress={() => { setBreastfeeding(!breastfeeding); setPregnant(false); }} />
        </View> : null}
      </Card>
      <Notice>Referenzwerte beschreiben die übliche Zufuhr gesunder Bevölkerungsgruppen. Dein persönlicher Bedarf kann davon abweichen.</Notice>
    </> : null}

    {step === 1 ? <>
      <Heading eyebrow="Deine Ernährung" title="Was soll nouri berücksichtigen?">Wir filtern Vorschläge, die nicht zu deiner Ernährungsweise oder deinen Allergien passen.</Heading>
      <Card elevated>
        <Text style={styles.sectionTitle}>Ernährungsweise</Text>
        <View style={styles.wrap}>{dietOptions.map(([key, label]) => <Chip key={key} label={label} selected={diet.includes(key)} onPress={() => toggle(key)} />)}</View>
        <Field label="Weitere Allergien" value={allergies} onChangeText={setAllergies} placeholder="z. B. Erdnuss, Soja" />
        <Text style={styles.helper}>Mehrere Allergien mit Komma trennen.</Text>
      </Card>
    </> : null}

    {step === 2 ? <>
      <Heading eyebrow="Bereit" title="Einfach essen. Klarer sehen.">Beschreibe Mahlzeiten in Alltagssprache, prüfe die Erkennung und erhalte verständliche Orientierung.</Heading>
      <Card tonal style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.summaryMark}>✓</Text><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>Keine Kalorienziele</Text><Text style={styles.summaryText}>Im Fokus stehen ausgewählte, handlungsrelevante Nährstoffe.</Text></View></View>
        <View style={styles.summaryRow}><Text style={styles.summaryMark}>✓</Text><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>Dokumentierte Quellen</Text><Text style={styles.summaryText}>Lebensmittelwerte stammen aus USDA FoodData Central.</Text></View></View>
        <View style={styles.summaryRow}><Text style={styles.summaryMark}>✓</Text><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>Keine Diagnose</Text><Text style={styles.summaryText}>nouri schätzt Zufuhr und beurteilt keinen körperlichen Status.</Text></View></View>
      </Card>
      <Notice warning>Die App ersetzt keine medizinische oder ernährungsmedizinische Beratung.</Notice>
    </> : null}

    <View style={styles.actions}>
      {step > 0 ? <Button ghost title="Zurück" onPress={() => setStep((current) => current - 1)} /> : null}
      {step < 2 ? <Button title="Weiter" onPress={() => setStep((current) => current + 1)} disabled={step === 0 && !valid} /> : <Button title="nouri starten" onPress={() => void save()} disabled={!valid} loading={busy} />}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  step: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  progress: { height: 5, backgroundColor: colors.line, borderRadius: radii.pill, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: 5, backgroundColor: colors.accent, borderRadius: radii.pill },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  helper: { color: colors.muted, fontSize: 11 },
  summary: { padding: spacing.lg, gap: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.surface, color: colors.primary, textAlign: 'center', lineHeight: 28, fontWeight: '800' },
  summaryCopy: { flex: 1, gap: 2 },
  summaryTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  summaryText: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  actions: { gap: spacing.xs, marginTop: spacing.sm },
});
