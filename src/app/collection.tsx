import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

type ClothesItem = {
  id: number;
  image_uri: string;
  category_id: number | null;
  color: string | null;
  season: string | null;
};

const CATEGORY_MAP: Record<number, string> = {
  1: 'Tshirt',
  2: 'Top',
  3: 'Blouse',
  4: 'Jeans',
  5: 'Pants',
  6: 'Skirt',
  7: 'Dress',
  8: 'Shoes',
  9: 'Hat',
  10: 'Jacket',
  11: 'Purse'
};

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<ClothesItem[]>([]);
  const router = useRouter();

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

  const deleteItem = (id: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to throw away this item? It will also be removed from any outfits using it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('DELETE FROM clothes WHERE id = ?', [id]);
              loadClothes(); 
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Could not delete the item.');
            }
          }
        }
      ]
    );
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
        <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
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
  backButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: '#2B6CB0',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1A202C',
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
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F7F9FC',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  listPadding: {
    paddingBottom: 40,
  },
});