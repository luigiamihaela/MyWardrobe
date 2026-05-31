import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../database/db';


export default function RootLayout() {
  
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown : false }} />
        
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="generator" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wardrobe" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}