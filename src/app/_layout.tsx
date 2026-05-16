import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../database/db';

export default function RootLayout() {
  
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Wardrobe' }} />
    </Stack>
  );
}