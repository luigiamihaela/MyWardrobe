import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#A0AEC0',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Home', tabBarIcon: ({ color }: { color: string }) => <Ionicons name="home" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="collection" 
        options={{ title: 'Collection', tabBarIcon: ({ color }: { color: string }) => <Ionicons name="grid" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="outfits" 
        options={{ title: 'Closet', tabBarIcon: ({ color }: { color: string }) => <Ionicons name="shirt" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="calendar" 
        options={{ title: 'Diary', tabBarIcon: ({ color }: { color: string }) => <Ionicons name="calendar" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="insights" 
        options={{ title: 'Insights', tabBarIcon: ({ color }: { color: string }) => <Ionicons name="pie-chart" size={24} color={color} /> }} 
      />
    </Tabs>
  );
}