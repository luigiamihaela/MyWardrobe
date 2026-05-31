import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import db from '../../database/db';

type TopOutfitData = {
  id: number;
  name: string;
  wear_count: number;
  d_uri: string | null;
  t_uri: string | null;
  b_uri: string | null;
};

type TopItemData = {
  id: number;
  image_uri: string;
  category_id: number;
  wear_count: number;
};

export default function InsightsScreen() {
  const router = useRouter();

  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [topOutfit, setTopOutfit] = useState<TopOutfitData | null>(null);
  const [topItems, setTopItems] = useState<TopItemData[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [])
  );

  const loadStatistics = () => {
    try {
      const logsCountResult = db.getFirstSync<{ total: number }>('SELECT COUNT(id) as total FROM outfit_logs');
      setTotalLogs(logsCountResult?.total || 0);

      const topOutfitQuery = `
        SELECT o.id, o.name, COUNT(l.id) as wear_count,
               d.image_uri AS d_uri, t.image_uri AS t_uri, b.image_uri AS b_uri
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        GROUP BY o.id
        ORDER BY wear_count DESC
        LIMIT 1
      `;
      const outfitResult = db.getFirstSync<TopOutfitData>(topOutfitQuery);
      setTopOutfit(outfitResult || null);

      const topItemsQuery = `
        SELECT c.id, c.image_uri, c.category_id, COUNT(l.id) as wear_count
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        JOIN clothes c ON (
          c.id = o.top_id OR 
          c.id = o.bottom_id OR 
          c.id = o.dress_id OR 
          c.id = o.shoes_id OR 
          c.id = o.outerwear_id
        )
        GROUP BY c.id
        ORDER BY wear_count DESC
        LIMIT 5
      `;
      const itemsResult = db.getAllSync<TopItemData>(topItemsQuery);
      setTopItems(itemsResult);

    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const getPercentage = (count: number) => {
    if (totalLogs === 0) return 0;
    return Math.round((count / totalLogs) * 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wardrobe Insights 📊</Text>
        <Text style={styles.subtitle}>Your style, analyzed.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalLogs}</Text>
          <Text style={styles.statLabel}>Total Outfits Logged</Text>
        </View>

        {totalLogs === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Not enough data yet.</Text>
            <Text style={styles.emptySubtext}>Log some outfits in your Diary to see your statistics!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>🏆 Most Worn Outfit</Text>
            {topOutfit && (
              <View style={styles.topOutfitCard}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Worn {topOutfit.wear_count} times</Text>
                </View>
                <Text style={styles.topOutfitName} numberOfLines={1}>{topOutfit.name}</Text>
                
                <View style={styles.previewGrid}>
                  {topOutfit.d_uri && <Image source={{ uri: topOutfit.d_uri }} style={styles.previewImage} />}
                  {topOutfit.t_uri && <Image source={{ uri: topOutfit.t_uri }} style={styles.previewImage} />}
                  {topOutfit.b_uri && <Image source={{ uri: topOutfit.b_uri }} style={styles.previewImage} />}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>🔥 Top 5 Favorite Pieces</Text>
            <View style={styles.itemsCard}>
              {topItems.map((item, index) => {
                const percentage = getPercentage(item.wear_count);
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                    <Image source={{ uri: item.image_uri }} style={styles.itemThumbnail} />
                    
                    <View style={styles.barContainer}>
                      <Text style={styles.itemStatsText}>
                        Worn {item.wear_count} times ({percentage}%)
                      </Text>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7E2',
    elevation: 2,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#D53F8C',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#702459',
    marginTop: 4,
    textAlign: 'center'
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statCard: {
    backgroundColor: '#D53F8C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#D53F8C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 16,
    color: '#FED7E2',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7E2',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#702459',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  topOutfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 2,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FED7E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#D53F8C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topOutfitName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  previewImage: {
    width: 70,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
    paddingBottom: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A0AEC0',
    width: 30,
  },
  itemThumbnail: {
    width: 50,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
    marginRight: 16,
  },
  barContainer: {
    flex: 1,
  },
  itemStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 6,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D53F8C',
    borderRadius: 4,
  },
});