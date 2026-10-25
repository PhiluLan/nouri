import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, Button, Card, Chip, Field, Heading, Notice, Screen, textStyles } from '../components/ui';
import { colors, radii, spacing } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { REFERENCE_PROFILE_VERSION, REFERENCE_SOURCE, REFERENCE_VERSION } from '../nutrition/references';
import { supabase } from '../lib/supabase';
import type { LifeStage, MenopauseStatus, PhytateLevel } from '../types/domain';

const dietOptions = [
  ['vegetarian', 'Vegetarisch'], ['vegan', 'Vegan'], ['lactose_free', 'Laktosefrei'],
  ['dairy_free', 'Milchfrei'], ['gluten_free', 'Glutenfrei'], ['fish_free', 'Ohne Fisch'],
] as const;

export default function OnboardingScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState(String(profile?.birth_year ?? 1990));
  const [weight, setWeight] = useState(profile?.weight_kg ? String(profile.weight_kg) : '');
  const [sex, setSex] = useState<'female' | 'male' | null>(profile?.sex === 'female' || profile?.sex === 'male' ? profile.sex : null);
  const [lifeStage, setLifeStage] = useState<LifeStage>(profile?.life_stage ?? 'none');
  const [menopause, setMenopause] = useState<MenopauseStatus>(profile?.menopause_status ?? 'not_applicable');
  const [phytate, setPhytate] = useState<PhytateLevel>(profile?.phytate_level ?? 'medium');
  const [diet, setDiet] = useState<string[]>(profile?.diet ?? []);
  const [allergies, setAllergies] = useState((profile?.allergies ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const parsedYear = Number(birthYear);
  const weightValue = Number(weight.replace(',', '.'));
  const valid = useMemo(() => parsedYear >= 1900 && parsedYear <= new Date().getFullYear() - 18 && weightValue >= 30 && weightValue <= 300 && sex !== null, [parsedYear, weightValue, sex]);

  function toggle(tag: string) {
    setDiet((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  function chooseSex(value: 'female' | 'male') {
    setSex(value);
    if (value === 'male') { setLifeStage('none'); setMenopause('not_applicable'); }
    else if (menopause === 'not_applicable') setMenopause('pre');
  }

  async function save() {
    if (!session || !valid || !sex) return Alert.alert('Angaben prüfen', 'Bitte fülle Geburtsjahr, Gewicht und Referenzgruppe vollständig aus.');
    setBusy(true);
    const isPregnant = lifeStage.startsWith('pregnant');
    const isBreastfeeding = lifeStage.startsWith('lactating');
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, birth_year: parsedYear, sex, weight_kg: weightValue,
      pregnant: isPregnant, breastfeeding: isBreastfeeding, life_stage: sex === 'female' ? lifeStage : 'none',
      menopause_status: sex === 'female' && lifeStage === 'none' ? menopause : 'not_applicable', phytate_level: phytate,
      reference_profile_version: REFERENCE_PROFILE_VERSION, diet,
      allergies: allergies.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean),
      reference_source: REFERENCE_SOURCE, reference_version: REFERENCE_VERSION, onboarded_at: new Date().toISOString(),
    });
    try {
      if (error) throw error;
      await refreshProfile();
      router.replace('/(tabs)/capture');
    } catch (cause) {
      Alert.alert('Speichern nicht möglich', cause instanceof Error ? cause.message : 'Unbekannter Fehler');
    } finally { setBusy(false); }
  }

  return <Screen>
    <View style={styles.top}><BrandMark /><Text style={styles.step}>{step + 1} von 3</Text></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>

    {step === 0 ? <>
      <Heading eyebrow="Persönliche Grundlage" title="In weniger als einer Minute">Wir fragen nur Angaben ab, die deine fachlichen Referenzwerte tatsächlich verändern.</Heading>
      {profile?.onboarded_at ? <Notice warning>Wir haben die Referenzlogik erweitert. Bitte ergänze dein Profil einmalig.</Notice> : null}
      <Card elevated>
        <Field label="Geburtsjahr" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />
        <Field label="Gewicht in kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Erforderlich für Protein" />
        <Text style={textStyles.label}>Physiologische BLV-Referenzgruppe</Text>
        <View style={styles.wrap}>
          <Chip label="Weiblich" selected={sex === 'female'} onPress={() => chooseSex('female')} />
          <Chip label="Männlich" selected={sex === 'male'} onPress={() => chooseSex('male')} />
        </View>
        <Text style={styles.helper}>Diese Angabe dient ausschließlich der Auswahl geschlechtsspezifischer Referenzwerte und sagt nichts über deine Geschlechtsidentität aus.</Text>
      </Card>
      <Notice>Referenzwerte beschreiben die übliche Zufuhr gesunder Bevölkerungsgruppen – nicht deinen körperlichen Versorgungsstatus.</Notice>
    </> : null}

    {step === 1 ? <>
      <Heading eyebrow="Feinabstimmung" title="Was trifft aktuell zu?">Lebensphase und Ernährungsweise verändern einzelne Referenzwerte.</Heading>
      <Card elevated>
        {sex === 'female' ? <>
          <Text style={textStyles.label}>Lebensphase</Text>
          <View style={styles.wrap}>
            <Chip label="Keine besondere Phase" selected={lifeStage === 'none'} onPress={() => setLifeStage('none')} />
            <Chip label="Schwanger · 1. Trimester" selected={lifeStage === 'pregnant_t1'} onPress={() => setLifeStage('pregnant_t1')} />
            <Chip label="Schwanger · 2. Trimester" selected={lifeStage === 'pregnant_t2'} onPress={() => setLifeStage('pregnant_t2')} />
            <Chip label="Schwanger · 3. Trimester" selected={lifeStage === 'pregnant_t3'} onPress={() => setLifeStage('pregnant_t3')} />
            <Chip label="Stillend · bis 6 Monate" selected={lifeStage === 'lactating_0_6'} onPress={() => setLifeStage('lactating_0_6')} />
            <Chip label="Stillend · über 6 Monate" selected={lifeStage === 'lactating_over_6'} onPress={() => setLifeStage('lactating_over_6')} />
          </View>
          {lifeStage === 'none' ? <><Text style={textStyles.label}>Menopause</Text><View style={styles.wrap}>
            <Chip label="Vor der Menopause" selected={menopause === 'pre'} onPress={() => setMenopause('pre')} />
            <Chip label="Nach der Menopause" selected={menopause === 'post'} onPress={() => setMenopause('post')} />
          </View></> : null}
        </> : null}
        <Text style={textStyles.label}>Vollkorn & Hülsenfrüchte</Text>
        <Text style={styles.helper}>Phytat beeinflusst die Zinkaufnahme. Wie häufig isst du stark phytatreiche Lebensmittel?</Text>
        <View style={styles.wrap}>
          <Chip label="Selten" selected={phytate === 'low'} onPress={() => setPhytate('low')} />
          <Chip label="Regelmässig" selected={phytate === 'medium'} onPress={() => setPhytate('medium')} />
          <Chip label="Sehr häufig" selected={phytate === 'high'} onPress={() => setPhytate('high')} />
          <Chip label="Fast jede Mahlzeit" selected={phytate === 'very_high'} onPress={() => setPhytate('very_high')} />
        </View>
      </Card>
    </> : null}

    {step === 2 ? <>
      <Heading eyebrow="Ernährungsfilter" title="Was soll nouri beachten?">Damit Empfehlungen zu dir passen. Alles hier ist optional.</Heading>
      <Card elevated>
        <Text style={styles.sectionTitle}>Ernährungsweise</Text>
        <View style={styles.wrap}>{dietOptions.map(([key, label]) => <Chip key={key} label={label} selected={diet.includes(key)} onPress={() => toggle(key)} />)}</View>
        <Field label="Weitere Allergien" value={allergies} onChangeText={setAllergies} placeholder="z. B. Erdnuss, Soja" />
        <Text style={styles.helper}>Mehrere Allergien mit Komma trennen.</Text>
      </Card>
      <Notice warning>nouri schätzt deine erfasste Zufuhr und stellt keine Mangel- oder Krankheitsdiagnose.</Notice>
    </> : null}

    <View style={styles.actions}>
      {step > 0 ? <Button ghost title="Zurück" onPress={() => setStep((current) => current - 1)} /> : null}
      {step < 2 ? <Button title="Weiter" onPress={() => setStep((current) => current + 1)} disabled={step === 0 && !valid} /> : <Button title="Profil speichern" onPress={() => void save()} disabled={!valid} loading={busy} />}
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
  helper: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  actions: { gap: spacing.xs, marginTop: spacing.sm },
});
