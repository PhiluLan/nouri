import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Heading, Notice, Screen, SectionHeader } from '../components/ui';
import { colors, radii, spacing } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { isPreviewMode } from '../lib/preview';
import { supabase } from '../lib/supabase';

const dietOptions = [
  ['vegetarian', 'Vegetarisch'], ['vegan', 'Vegan'], ['lactose_free', 'Laktosefrei'],
  ['dairy_free', 'Milchfrei'], ['gluten_free', 'Glutenfrei'], ['fish_free', 'Ohne Fisch'],
] as const;

export default function SettingsScreen() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [birthYear, setBirthYear] = useState(String(profile?.birth_year ?? 1990));
  const [weight, setWeight] = useState(profile?.weight_kg ? String(profile.weight_kg) : '');
  const [sex, setSex] = useState(profile?.sex ?? 'prefer_not');
  const [pregnant, setPregnant] = useState(profile?.pregnant ?? false);
  const [breastfeeding, setBreastfeeding] = useState(profile?.breastfeeding ?? false);
  const [diet, setDiet] = useState<string[]>(profile?.diet ?? []);
  const [allergies, setAllergies] = useState((profile?.allergies ?? []).join(', '));
  const [busy, setBusy] = useState<'save' | 'delete' | 'signout' | null>(null);
  const parsedYear = Number(birthYear);
  const validYear = useMemo(() => parsedYear >= 1900 && parsedYear <= new Date().getFullYear() - 18, [parsedYear]);

  function toggle(tag: string) {
    setDiet((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function save() {
    if (!session || !validYear) return Alert.alert('Geburtsjahr prüfen', 'nouri ist für Erwachsene ab 18 Jahren ausgelegt.');
    const weightValue = weight.trim() ? Number(weight.replace(',', '.')) : null;
    if (weightValue !== null && (weightValue < 30 || weightValue > 300)) return Alert.alert('Gewicht prüfen', 'Bitte gib 30 bis 300 kg ein oder lasse das Feld leer.');
    setBusy('save');
    try {
      const { error } = await supabase.from('profiles').update({
        birth_year: parsedYear,
        sex,
        weight_kg: weightValue,
        pregnant: sex === 'female' && pregnant,
        breastfeeding: sex === 'female' && breastfeeding,
        diet,
        allergies: allergies.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean),
      }).eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Speichern nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  function confirmDeleteMeals() {
    if (!session) return;
    Alert.alert('Alle Mahlzeiten löschen?', 'Dein Profil bleibt bestehen. Die erfassten Mahlzeiten und Nährstoffwerte werden dauerhaft entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Dauerhaft löschen', style: 'destructive', onPress: async () => {
        setBusy('delete');
        try {
          const { error } = await supabase.from('meals').delete().eq('user_id', session.user.id);
          if (error) throw error;
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Daten gelöscht', 'Alle Mahlzeiten wurden entfernt.');
        } catch (error) {
          Alert.alert('Löschen nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
        } finally {
          setBusy(null);
        }
      } },
    ]);
  }

  async function logout() {
    setBusy('signout');
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Abmelden nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(null);
    }
  }

  if (!profile) return null;
  return <Screen>
    <View style={styles.topBar}>
      <Text style={styles.topTitle}>Profil</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Einstellungen schließen" onPress={() => router.back()} hitSlop={10} style={styles.close}><Text style={styles.closeText}>Fertig</Text></Pressable>
    </View>
    <Heading eyebrow="Deine Grundlage" title="Was passt zu dir?">Diese Angaben bestimmen Referenzwerte und filtern ungeeignete Lebensmittelvorschläge.</Heading>
    {isPreviewMode ? <Notice warning>Im Vorschau-Modus können Profilangaben nicht dauerhaft geändert werden.</Notice> : null}

    <SectionHeader title="Referenzwerte" />
    <Card elevated>
      <Field label="Geburtsjahr" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />
      <Field label="Gewicht in kg (optional)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Für die Protein-Referenz" />
      <Text style={styles.label}>Referenzgruppe</Text>
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

    <SectionHeader title="Ernährungsfilter" />
    <Card elevated>
      <View style={styles.wrap}>{dietOptions.map(([key, label]) => <Chip key={key} label={label} selected={diet.includes(key)} onPress={() => toggle(key)} />)}</View>
      <Field label="Weitere Allergien" value={allergies} onChangeText={setAllergies} placeholder="z. B. Erdnuss, Soja" />
      <Text style={styles.helper}>Mehrere Allergien mit Komma trennen.</Text>
    </Card>
    <Button title="Änderungen speichern" onPress={() => void save()} loading={busy === 'save'} disabled={isPreviewMode || Boolean(busy) || !validYear} />

    <SectionHeader title="Daten & Konto" />
    <Card tonal>
      <Text style={styles.dataTitle}>Deine Daten gehören dir</Text>
      <Text style={styles.dataText}>Mahlzeiten sind deinem Konto zugeordnet und durch Datenbankregeln vor anderen Nutzern geschützt. API-Schlüssel liegen ausschließlich auf dem Server.</Text>
    </Card>
    {!isPreviewMode ? <>
      <Button danger title="Alle Mahlzeiten löschen" onPress={confirmDeleteMeals} loading={busy === 'delete'} disabled={Boolean(busy)} />
      <Button secondary title="Abmelden" onPress={() => void logout()} loading={busy === 'signout'} disabled={Boolean(busy)} />
    </> : null}
    <Notice warning>nouri ist kein Medizinprodukt und ersetzt keine medizinische oder ernährungsmedizinische Beratung.</Notice>
  </Screen>;
}

const styles = StyleSheet.create({
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  close: { minHeight: 36, borderRadius: radii.pill, paddingHorizontal: 14, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  closeText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  dataTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  dataText: { color: colors.inkSoft, fontSize: 13, lineHeight: 20 },
});
