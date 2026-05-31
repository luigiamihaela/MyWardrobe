import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThemedButton from '../../components/ThemedButton';
import ThemedCard from '../../components/ThemedCard';
import { useTheme } from '../../context/ThemeContext';
import db from '../../database/db';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isPink, toggleTheme } = useTheme();
  
  const [stats, setStats] = useState({ clothes: 0, outfits: 0 });
  const [username, setUsername] = useState('Stylist');

  useFocusEffect(
    useCallback(() => {
      try {
        const clothesCount = db.getFirstSync<{ total: number }>('SELECT COUNT(id) as total FROM clothes');
        const outfitsCount = db.getFirstSync<{ total: number }>('SELECT COUNT(id) as total FROM outfits');
        const userRow = db.getFirstSync<{ username: string }>('SELECT username FROM user_profile LIMIT 1');

        setStats({
          clothes: clothesCount?.total || 0,
          outfits: outfitsCount?.total || 0,
        });

        if (userRow) {
        setUsername(userRow.username);
      }
      } catch (error) {
        console.error(error);
      }
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.subtext }]}>Hello, {username}! 👋</Text>
          <Text style={styles.title}>My Wardrobe</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.themeToggle, { backgroundColor: theme.iconBtn }]} onPress={toggleTheme}>
            <Text style={styles.themeToggleText}>{isPink ? '🌸' : '🔷'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.themeToggle, { backgroundColor: theme.iconBtn }]} onPress={() => router.push('/settings')}>
            <Text style={styles.themeToggleText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <ThemedCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.clothes}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </ThemedCard>
          
          <ThemedCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.outfits}</Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </ThemedCard>
        </View>

        <Text style={styles.sectionTitle}>Wardrobe Inventory</Text>
        <ThemedButton title="Add Item" onPress={() => router.push('/add')} />
        <ThemedButton title="👕 View All Items" onPress={() => router.push('/collection')} variant="outline" />

        <Text style={styles.sectionTitle}>Outfits</Text>
        <ThemedButton title="👗 Outfit Builder" onPress={() => router.push('/builder')} />
        <ThemedButton title="👚 Saved Outfits" onPress={() => router.push('/outfits')} variant="outline" />
        <ThemedButton title="✨ Smart Generator" onPress={() => router.push('/generator')} />  
        
        <Text style={styles.sectionTitle}>Tracking & Analysis</Text>
        <ThemedButton title="📅 Outfit Diary" onPress={() => router.push('/calendar')} />
        <ThemedButton title="📊 Wardrobe Insights" onPress={() => router.push('/insights')} variant="outline" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  scrollContent: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 24, // Spațiu puțin mai mare între secțiuni pentru a respira UI-ul
    marginBottom: 12,
  },
});