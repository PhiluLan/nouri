import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Heading, Notice, Screen, SectionHeader } from '../components/ui';
import { colors, radii, spacing } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { isPreviewMode } from '../lib/preview';
import { supabase } from '../lib/supabase';
import { REFERENCE_PROFILE_VERSION, REFERENCE_SOURCE, REFERENCE_VERSION } from '../nutrition/references';
import type { LifeStage, MenopauseStatus, PhytateLevel } from '../types/domain';

const dietOptions = [
  ['vegetarian', 'Vegetarisch'], ['vegan', 'Vegan'], ['lactose_free', 'Laktosefrei'],
  ['dairy_free', 'Milchfrei'], ['gluten_free', 'Glutenfrei'], ['fish_free', 'Ohne Fisch'],
] as const;

export default function SettingsScreen() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [birthYear, setBirthYear] = useState(String(profile?.birth_year ?? 1990));
  const [weight, setWeight] = useState(profile?.weight_kg ? String(profile.weight_kg) : '');
  const [sex, setSex] = useState<'female' | 'male' | null>(profile?.sex === 'female' || profile?.sex === 'male' ? profile.sex : null);
  const [lifeStage, setLifeStage] = useState<LifeStage>(profile?.life_stage ?? 'none');
  const [menopause, setMenopause] = useState<MenopauseStatus>(profile?.menopause_status ?? 'not_applicable');
  const [phytate, setPhytate] = useState<PhytateLevel>(profile?.phytate_level ?? 'medium');
  const [diet, setDiet] = useState<string[]>(profile?.diet ?? []);
  const [allergies, setAllergies] = useState((profile?.allergies ?? []).join(', '));
  const [busy, setBusy] = useState<'save' | 'delete' | 'account' | 'signout' | null>(null);
  const parsedYear = Number(birthYear);
  const validYear = useMemo(() => parsedYear >= 1900 && parsedYear <= new Date().getFullYear() - 18, [parsedYear]);
  const weightValue = Number(weight.replace(',', '.'));
  const valid = validYear && weightValue >= 30 && weightValue <= 300 && sex !== null;

  function toggle(tag: string) {
    setDiet((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function save() {
    if (!session || !valid || !sex) return Alert.alert('Angaben prüfen', 'Bitte fülle Geburtsjahr, Gewicht und Referenzgruppe vollständig aus.');
    setBusy('save');
    try {
      const { error } = await supabase.from('profiles').update({
        birth_year: parsedYear,
        sex,
        weight_kg: weightValue,
        pregnant: lifeStage.startsWith('pregnant'),
        breastfeeding: lifeStage.startsWith('lactating'),
        life_stage: sex === 'female' ? lifeStage : 'none',
        menopause_status: sex === 'female' && lifeStage === 'none' ? menopause : 'not_applicable',
        phytate_level: phytate,
        reference_profile_version: REFERENCE_PROFILE_VERSION,
        reference_source: REFERENCE_SOURCE,
        reference_version: REFERENCE_VERSION,
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

  function confirmDeleteAccount() {
    if (!session) return;
    Alert.alert('nouri-Konto löschen?', 'Dein Konto, dein Profil und alle Mahlzeiten werden dauerhaft gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Konto löschen', style: 'destructive', onPress: () => {
        Alert.alert('Wirklich endgültig löschen?', 'Nach dem Löschen kannst du dich mit diesem Konto nicht mehr anmelden.', [
          { text: 'Nein, behalten', style: 'cancel' },
          { text: 'Endgültig löschen', style: 'destructive', onPress: async () => {
            setBusy('account');
            try {
              const { error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE_ACCOUNT' } });
              if (error) throw error;
              await supabase.auth.signOut({ scope: 'local' });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Konto nicht gelöscht', error instanceof Error ? error.message : 'Unbekannter Fehler');
              setBusy(null);
            }
          } },
        ]);
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
      <Field label="Gewicht in kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Erforderlich für Protein" />
      <Text style={styles.label}>Physiologische BLV-Referenzgruppe</Text>
      <View style={styles.wrap}>
        <Chip label="Weiblich" selected={sex === 'female'} onPress={() => { setSex('female'); if (menopause === 'not_applicable') setMenopause('pre'); }} />
        <Chip label="Männlich" selected={sex === 'male'} onPress={() => { setSex('male'); setLifeStage('none'); setMenopause('not_applicable'); }} />
      </View>
      <Text style={styles.helper}>Nur zur Auswahl der geschlechtsspezifischen Referenzwerte; unabhängig von deiner Geschlechtsidentität.</Text>
      {sex === 'female' ? <>
        <Text style={styles.label}>Lebensphase</Text>
        <View style={styles.wrap}>
          <Chip label="Keine" selected={lifeStage === 'none'} onPress={() => setLifeStage('none')} />
          <Chip label="Schwanger · T1" selected={lifeStage === 'pregnant_t1'} onPress={() => setLifeStage('pregnant_t1')} />
          <Chip label="Schwanger · T2" selected={lifeStage === 'pregnant_t2'} onPress={() => setLifeStage('pregnant_t2')} />
          <Chip label="Schwanger · T3" selected={lifeStage === 'pregnant_t3'} onPress={() => setLifeStage('pregnant_t3')} />
          <Chip label="Stillend · ≤6 Mon." selected={lifeStage === 'lactating_0_6'} onPress={() => setLifeStage('lactating_0_6')} />
          <Chip label="Stillend · >6 Mon." selected={lifeStage === 'lactating_over_6'} onPress={() => setLifeStage('lactating_over_6')} />
        </View>
        {lifeStage === 'none' ? <View style={styles.wrap}>
          <Chip label="Vor Menopause" selected={menopause === 'pre'} onPress={() => setMenopause('pre')} />
          <Chip label="Nach Menopause" selected={menopause === 'post'} onPress={() => setMenopause('post')} />
        </View> : null}
      </> : null}
      <Text style={styles.label}>Vollkorn & Hülsenfrüchte</Text>
      <View style={styles.wrap}>
        <Chip label="Selten" selected={phytate === 'low'} onPress={() => setPhytate('low')} />
        <Chip label="Regelmässig" selected={phytate === 'medium'} onPress={() => setPhytate('medium')} />
        <Chip label="Sehr häufig" selected={phytate === 'high'} onPress={() => setPhytate('high')} />
        <Chip label="Fast immer" selected={phytate === 'very_high'} onPress={() => setPhytate('very_high')} />
      </View>
    </Card>

    <SectionHeader title="Ernährungsfilter" />
    <Card elevated>
      <View style={styles.wrap}>{dietOptions.map(([key, label]) => <Chip key={key} label={label} selected={diet.includes(key)} onPress={() => toggle(key)} />)}</View>
      <Field label="Weitere Allergien" value={allergies} onChangeText={setAllergies} placeholder="z. B. Erdnuss, Soja" />
      <Text style={styles.helper}>Mehrere Allergien mit Komma trennen.</Text>
    </Card>
    <Button title="Änderungen speichern" onPress={() => void save()} loading={busy === 'save'} disabled={isPreviewMode || Boolean(busy) || !valid} />

    <SectionHeader title="Daten & Konto" />
    <Card tonal>
      <Text style={styles.dataTitle}>Deine Daten gehören dir</Text>
      <Text style={styles.dataText}>Mahlzeiten sind deinem Konto zugeordnet und durch Datenbankregeln vor anderen Nutzern geschützt. API-Schlüssel liegen ausschließlich auf dem Server.</Text>
    </Card>
    {!isPreviewMode ? <>
      <Button danger title="Alle Mahlzeiten löschen" onPress={confirmDeleteMeals} loading={busy === 'delete'} disabled={Boolean(busy)} />
      <Button secondary title="Abmelden" onPress={() => void logout()} loading={busy === 'signout'} disabled={Boolean(busy)} />
      <Pressable accessibilityRole="button" disabled={Boolean(busy)} onPress={confirmDeleteAccount} style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed]}>
        <Text style={styles.deleteAccountText}>{busy === 'account' ? 'Konto wird gelöscht …' : 'Konto endgültig löschen'}</Text>
      </Pressable>
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
  deleteAccount: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  deleteAccountText: { color: colors.danger, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.65 },
});
