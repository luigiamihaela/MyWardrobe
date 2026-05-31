import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../../database/db';

type OutfitRecord = {
  id: number;
  name: string;
  top_image: string | null;
  bottom_image: string | null;
  dress_image: string | null;
  shoes_image: string | null;
  outerwear_image: string | null;
  hat_image: string | null;
  purse_image: string | null;
};

export default function SavedOutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [])
  );

  const loadOutfits = () => {
    try {
      const query = `
        SELECT 
          o.id, 
          o.name,
          t.image_uri AS top_image,
          b.image_uri AS bottom_image,
          d.image_uri AS dress_image,
          s.image_uri AS shoes_image,
          out.image_uri AS outerwear_image,
          h.image_uri AS hat_image,
          p.image_uri AS purse_image
        FROM outfits o
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        LEFT JOIN clothes s ON o.shoes_id = s.id
        LEFT JOIN clothes out ON o.outerwear_id = out.id
        LEFT JOIN clothes h ON o.hat_id = h.id
        LEFT JOIN clothes p ON o.purse_id = p.id
        ORDER BY o.id DESC
      `;
      const result = db.getAllSync<OutfitRecord>(query);
      setOutfits(result);
    } catch (error) {
      console.error('Error loading outfits:', error);
    }
  };

  const deleteOutfit = (id: number, name: string) => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('DELETE FROM outfits WHERE id = ?', [id]);
              loadOutfits();
            } catch (error) {
              console.error('Error deleting outfit:', error);
            }
          }
        }
      ]
    );
  };

  const renderOutfitCard = ({ item }: { item: OutfitRecord }) => {
    const images = [
      item.hat_image,
      item.outerwear_image,
      item.dress_image,
      item.top_image,
      item.bottom_image,
      item.purse_image,
      item.shoes_image
    ].filter(Boolean) as string[];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.outfitName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/builder', params: { editId: item.id } })} 
              style={styles.editButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteOutfit(item.id, item.name)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.imagesGrid}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.clothingThumbnail} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
      </View>

      {outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No outfits saved yet.</Text>
          <Text style={styles.emptySubtext}>Go to Create An Outfit to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item: OutfitRecord) => item.id.toString()}
          renderItem={renderOutfitCard}
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
  header: {
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#2B6CB0',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  listPadding: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingBottom: 12,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  editText: {
    color: '#2B6CB0',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  deleteText: {
    color: '#E53E3E',
    fontWeight: '600',
    fontSize: 14,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clothingThumbnail: {
    width: 70,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
  },
});