import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../database/db';

export default function RootLayout() {
  
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown : false }} />
      <Stack.Screen name="collection" options={{ title: '' }} />
      <Stack.Screen name="add" options={{ title: '' }} />
      <Stack.Screen name="builder" options={{ title: '' }} />
      <Stack.Screen name="outfits" options={{ title: '' }} />
      <Stack.Screen name="generator" options={{ title: '' }} />
      <Stack.Screen name="calendar" options={{ title: '' }} />
      <Stack.Screen name="insights" options={{ title: '' }} />
    </Stack>
  );
}