import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Button, Field, Heading, Notice, Screen, textStyles } from '../../components/ui';
import { colors } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/" />;

  async function submit() {
    if (!isSupabaseConfigured) return Alert.alert('Konfiguration fehlt', 'Trage die Supabase URL und den Publishable Key in .env ein.');
    if (!email.trim() || password.length < 8) return Alert.alert('Eingabe prüfen', 'Bitte gib eine gültige E-Mail und mindestens 8 Zeichen als Passwort ein.');
    setBusy(true);
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) Alert.alert('E-Mail bestätigen', 'Öffne den Bestätigungslink und melde dich danach an.');
    } catch (error) {
      Alert.alert('Anmeldung nicht möglich', error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setBusy(false);
    }
  }

  return <Screen>
    <View style={styles.brand}><Text style={styles.mark}>n</Text><Text style={styles.brandText}>nouri</Text></View>
    <Heading eyebrow="Einfach essen. Klarer sehen." title={mode === 'login' ? 'Willkommen zurück' : 'Dein ruhiger Ernährungscheck'}>
      Keine Kalorienziele. Nur nachvollziehbare Nährstoffdaten und passende nächste Lebensmittel.
    </Heading>
    {!isSupabaseConfigured ? <Notice warning>Setup-Modus: Die App benötigt die Werte aus .env.example. Es werden keine Mock-Nutzerdaten eingesetzt.</Notice> : null}
    <Field label="E-Mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <Field label="Passwort" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
    <Button title={mode === 'login' ? 'Anmelden' : 'Konto erstellen'} onPress={submit} loading={busy} />
    <Text style={textStyles.muted}>Mit der Nutzung akzeptierst du, dass nouri eine Schätzung der Nährstoffzufuhr liefert – keine medizinische Beurteilung.</Text>
    <Button secondary title={mode === 'login' ? 'Neu hier? Konto erstellen' : 'Schon registriert? Anmelden'} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} />
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 36 },
  mark: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, color: colors.white, textAlign: 'center', lineHeight: 38, fontSize: 24, fontWeight: '700' },
  brandText: { color: colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
});
