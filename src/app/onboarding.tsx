import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Field, Heading, Notice, Screen, textStyles } from '../components/ui';
import { colors, spacing } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const dietOptions = [
  ['vegetarian', 'Vegetarisch'], ['vegan', 'Vegan'], ['lactose_free', 'Laktosefrei'],
  ['dairy_free', 'Milchfrei'], ['gluten_free', 'Glutenfrei'], ['fish_free', 'Ohne Fisch'],
] as const;

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
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
    <Heading eyebrow="1 von 1" title="Was passt zu dir?">Damit wählen wir passende Referenzwerte und vermeiden unpassende Vorschläge.</Heading>
    <Notice>Referenzwerte beschreiben die übliche Zufuhr gesunder Bevölkerungsgruppen. Dein persönlicher Bedarf und dein körperlicher Versorgungsstatus können davon abweichen.</Notice>
    <Card>
      <Text style={styles.sectionTitle}>Grundlagen</Text>
      <Field label="Geburtsjahr" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />
      <Field label="Gewicht in kg (optional, für Protein-Referenz)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="z. B. 68" />
      <Text style={textStyles.label}>Referenzgruppe</Text>
      <View style={styles.wrap}>
        <Chip label="Weiblich" selected={sex === 'female'} onPress={() => setSex('female')} />
        <Chip label="Männlich" selected={sex === 'male'} onPress={() => setSex('male')} />
        <Chip label="Divers" selected={sex === 'other'} onPress={() => setSex('other')} />
        <Chip label="Keine Angabe" selected={sex === 'prefer_not'} onPress={() => setSex('prefer_not')} />
      </View>
      {sex === 'female' ? <View style={styles.wrap}>
        <Chip label="Schwanger" selected={pregnant} onPress={() => setPregnant(!pregnant)} />
        <Chip label="Stillend" selected={breastfeeding} onPress={() => setBreastfeeding(!breastfeeding)} />
      </View> : null}
    </Card>
    <Card>
      <Text style={styles.sectionTitle}>Ernährungsweise</Text>
      <View style={styles.wrap}>{dietOptions.map(([key, label]) => <Chip key={key} label={label} selected={diet.includes(key)} onPress={() => toggle(key)} />)}</View>
      <Field label="Weitere Allergien (mit Komma trennen)" value={allergies} onChangeText={setAllergies} placeholder="z. B. Erdnuss, Soja" />
    </Card>
    <Button title="nouri einrichten" onPress={save} disabled={!valid} loading={busy} />
  </Screen>;
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
