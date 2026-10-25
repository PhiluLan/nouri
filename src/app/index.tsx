import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../components/theme';
import { useAuth } from '../contexts/AuthContext';
import { isPreviewMode } from '../lib/preview';
import { referenceProfileIsComplete } from '../nutrition/references';

export default function Index() {
  const { session, profile, loading } = useAuth();
  if (isPreviewMode) return <Redirect href="/(tabs)/capture" />;
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!referenceProfileIsComplete(profile)) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/capture" />;
}
