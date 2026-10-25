import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { colors } from '../../components/theme';
import { useAuth } from '../../contexts/AuthContext';
import { isPreviewMode } from '../../lib/preview';

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();
  if (!isPreviewMode && !loading && !session) return <Redirect href="/(auth)/login" />;
  if (!isPreviewMode && !loading && !profile) return <Redirect href="/onboarding" />;
  return <NativeTabs tintColor={colors.primary} backgroundColor={colors.surface} disableTransparentOnScrollEdge>
    <NativeTabs.Trigger name="capture">
      <NativeTabs.Trigger.Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} md={{ default: 'add_circle', selected: 'add_circle' }} />
      <NativeTabs.Trigger.Label>Erfassen</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="day">
      <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md={{ default: 'analytics', selected: 'analytics' }} />
      <NativeTabs.Trigger.Label>Tagescheck</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="recommendations">
      <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md={{ default: 'spa', selected: 'spa' }} />
      <NativeTabs.Trigger.Label>Ideen</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
