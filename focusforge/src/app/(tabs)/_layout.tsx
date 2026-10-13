import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/useTheme';

const TABS = [
  { name: 'index', title: 'Today', icon: 'sunny' },
  { name: 'blocks', title: 'Blocks', icon: 'shield-checkmark' },
  { name: 'insights', title: 'Insights', icon: 'stats-chart' },
  { name: 'settings', title: 'Settings', icon: 'settings' },
] as const;

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textSubtle,
        tabBarStyle: [
          { backgroundColor: t.surface, borderTopColor: t.border },
          // Web has no bottom safe-area inset, so give labels a little room.
          Platform.OS === 'web' && { height: 64, paddingBottom: 8 },
        ],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Icon name={focused ? tab.icon : `${tab.icon}-outline`} color={color} size={size - 2} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
