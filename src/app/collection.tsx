import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import db from '../database/db';

type ClothesItem = {
  id: number;
  image_uri: string;
  category_id: number | null;
  color: string | null;
  season: string | null;
};

const CATEGORY_MAP: Record<number, string> = {
  1: 'Top',
  2: 'Bottom',
  3: 'Shoes',
  4: 'Outerwear'
};

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<ClothesItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadClothes();
    }, [])
  );

  const loadClothes = () => {
    try {
      const result = db.getAllSync<ClothesItem>('SELECT * FROM clothes ORDER BY id DESC');
      setClothes(result);
    } catch (error) {
      console.error('Error loading clothes:', error);
    }
  };

  const renderItem = ({ item }: { item: ClothesItem }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_uri }} style={styles.image} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.categoryText}>
          {item.category_id ? CATEGORY_MAP[item.category_id] : 'No category'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Collection</Text>
      
      {clothes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your closet is empty.</Text>
          <Text style={styles.emptySubtext}>Go back and add some items!</Text>
        </View>
      ) : (
        <FlatList
          data={clothes}
          keyExtractor={(item: ClothesItem) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1A202C',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4, 
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F7F9FC',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listPadding: {
    paddingBottom: 40,
  },
});