import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { BrandMark, Button, Card, Field, Heading, Notice, Screen } from '../../components/ui';
import { colors, radii, spacing } from '../../components/theme';
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
    <View style={styles.brand}><BrandMark /></View>
    <Heading eyebrow="Einfach essen. Klarer sehen." title={mode === 'login' ? 'Willkommen zurück' : 'Lerne deine Ernährung besser kennen'}>
      Ohne Kalorienziele. Mit nachvollziehbaren Nährstoffdaten und konkreten Ideen für den nächsten Teller.
    </Heading>
    {!isSupabaseConfigured ? <Notice warning>Setup-Modus: Die App benötigt die Werte aus .env.example. Es werden keine Mock-Nutzerdaten eingesetzt.</Notice> : null}
    <Card elevated style={styles.form}>
      <Field label="E-Mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Field label="Passwort" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} textContentType={mode === 'login' ? 'password' : 'newPassword'} />
      <Button title={mode === 'login' ? 'Anmelden' : 'Konto erstellen'} onPress={() => void submit()} loading={busy} />
      <Button ghost title={mode === 'login' ? 'Neu hier? Konto erstellen' : 'Schon registriert? Anmelden'} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} />
    </Card>
    <View style={styles.trustRow}>
      <Text style={styles.trustMark}>✓</Text><Text style={styles.trustText}>Quellenbasierte Lebensmittelwerte</Text>
      <Text style={styles.trustMark}>✓</Text><Text style={styles.trustText}>Keine medizinischen Diagnosen</Text>
    </View>
    <Text style={styles.legal}>nouri schätzt deine erfasste Nährstoffzufuhr. Die App ist kein Medizinprodukt und ersetzt keine fachliche Beratung.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { marginTop: spacing.lg, marginBottom: spacing.xl },
  form: { padding: spacing.lg, gap: spacing.md },
  trustRow: { borderRadius: radii.medium, backgroundColor: colors.primarySoft, padding: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  trustMark: { color: colors.primary, fontSize: 12, fontWeight: '800', marginLeft: 4 },
  trustText: { color: colors.inkSoft, fontSize: 12, marginRight: 6 },
  legal: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: spacing.md },
});
