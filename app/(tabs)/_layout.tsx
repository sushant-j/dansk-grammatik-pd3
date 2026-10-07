import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ui/theme';
import { HeaderActions } from '../../src/ui/ThemeToggle';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * The five places a learner goes:
 *   Path     — every grammar rule in order, lesson by lesson (the landing tab)
 *   Today    — the one thing to do next, and how close the exam is
 *   Practise — every trainer, grouped by what it trains
 *   Exam     — what the exam looks like, past oral topics, writing tasks
 *   Progress — mastery, streak, and the full grammar map
 */
const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Path', icon: 'map-outline', iconActive: 'map' },
  { name: 'today', title: 'Today', icon: 'today-outline', iconActive: 'today' },
  { name: 'practise', title: 'Practise', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'exam', title: 'Exam', icon: 'document-text-outline', iconActive: 'document-text' },
  { name: 'progress', title: 'Progress', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
];

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.c.bg },
        headerTintColor: t.c.text,
        headerTitleStyle: { fontFamily: t.fontFamily.bold },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        sceneStyle: { backgroundColor: t.c.bg },
        tabBarActiveTintColor: t.c.accent,
        tabBarInactiveTintColor: t.c.textMuted,
        // Explicit height: this face's line box is taller than the system font's,
        // and the default bar clips the labels.
        tabBarStyle: {
          backgroundColor: t.c.surface,
          borderTopColor: t.c.border,
          height: 64 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: { fontFamily: t.fontFamily.semibold, fontSize: 12, lineHeight: 16, flexShrink: 0 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
