import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BrandMark, Button, Card, Field, Heading, Notice, Screen } from '../components/ui';
import { spacing } from '../components/theme';
import { createSessionFromAuthUrl } from '../lib/auth-links';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const url = Linking.useURL();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'saving'>('loading');
  const [message, setMessage] = useState('Der sichere Rücksetzlink wird geprüft.');

  useEffect(() => {
    if (!url) return;
    let active = true;
    createSessionFromAuthUrl(url)
      .then((session) => {
        if (!active) return;
        if (!session) throw new Error('Der Rücksetzlink ist abgelaufen oder wurde bereits verwendet.');
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Der Rücksetzlink konnte nicht geprüft werden.');
        setState('error');
      });
    return () => { active = false; };
  }, [url]);

  async function updatePassword() {
    if (password.length < 8) return Alert.alert('Passwort zu kurz', 'Verwende mindestens 8 Zeichen.');
    if (password !== confirmation) return Alert.alert('Passwörter unterscheiden sich', 'Bitte wiederhole das neue Passwort identisch.');
    setState('saving');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
      Alert.alert('Passwort geändert', 'Du kannst dich jetzt mit deinem neuen Passwort anmelden.', [
        { text: 'Zur Anmeldung', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      setState('ready');
      Alert.alert('Ändern nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    }
  }

  return <Screen>
    <View style={styles.brand}><BrandMark /></View>
    <Heading eyebrow="Kontosicherheit" title="Neues Passwort wählen">Der Link ist nur für diesen Vorgang bestimmt und läuft automatisch ab.</Heading>
    {state === 'loading' ? <Notice>{message}</Notice> : null}
    {state === 'error' ? <>
      <Notice danger>{message}</Notice>
      <Button secondary title="Neuen Link anfordern" onPress={() => router.replace('/(auth)/login?mode=reset')} />
    </> : null}
    {state === 'ready' || state === 'saving' ? <Card elevated style={styles.form}>
      <Field label="Neues Passwort" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <Field label="Passwort wiederholen" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <Text style={styles.helper}>Mindestens 8 Zeichen. Verwende ein Passwort, das du nicht für andere Dienste nutzt.</Text>
      <Button title="Passwort sicher ändern" onPress={() => void updatePassword()} loading={state === 'saving'} />
    </Card> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { marginTop: spacing.lg, marginBottom: spacing.xl },
  form: { padding: spacing.lg, gap: spacing.md },
  helper: { color: '#66706A', fontSize: 12, lineHeight: 18 },
});
