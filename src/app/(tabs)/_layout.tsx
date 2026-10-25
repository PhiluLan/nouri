import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { isPreviewMode } from '../../lib/preview';

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();
  if (!isPreviewMode && !loading && !session) return <Redirect href="/(auth)/login" />;
  if (!isPreviewMode && !loading && !profile) return <Redirect href="/onboarding" />;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 82, paddingTop: 8 },
    tabBarLabelStyle: { fontWeight: '600', fontSize: 12, paddingBottom: 8 },
  }}>
    <Tabs.Screen name="capture" options={{ title: 'Erfassen', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>＋</Text> }} />
    <Tabs.Screen name="day" options={{ title: 'Tagescheck', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17 }}>◉</Text> }} />
    <Tabs.Screen name="recommendations" options={{ title: 'Empfehlungen', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✦</Text> }} />
  </Tabs>;
}
