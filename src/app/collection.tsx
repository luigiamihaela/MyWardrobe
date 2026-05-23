import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const SEASONS = ['Summer', 'Winter', 'Spring', 'Autumn', 'All Year'];
const COLORS = ['Black', 'White', 'Gray', 'Blue', 'Red', 'Green', 'Yellow', 'Purple', 
  'Pink', 'Orange', 'Brown', 'Beige/Cream', 'Multicolor'];

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<ClothesItem[]>([]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothesItem | null>(null);
  const [editCategory, setEditCategory] = useState<number>(1);
  const [editColor, setEditColor] = useState<string>('Black');
  const [editSeason, setEditSeason] = useState<string>('Summer');

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

  const openEditModal = (item: ClothesItem) => {
    setEditingItem(item);
    setEditCategory(item.category_id || 1);
    setEditColor(item.color || 'Black');
    setEditSeason(item.season || 'Summer');
    setIsEditModalVisible(true);
  };

  const saveChanges = () => {
    if (!editingItem) return;
    try {
      db.runSync(
        'UPDATE clothes SET category_id = ?, color = ?, season = ? WHERE id = ?',
        [editCategory, editColor, editSeason, editingItem.id]
      );
      setIsEditModalVisible(false);
      loadClothes();
      Alert.alert('Success', 'Item updated successfully.');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Could not update the item.');
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
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
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

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item Attributes</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              
              <Text style={styles.formLabel}>Category:</Text>
              <View style={styles.chipsGrid}>
                {Object.keys(CATEGORY_MAP).map((key) => {
                  const id = Number(key);
                  return (
                    <TouchableOpacity 
                      key={id} 
                      style={[styles.chip, editCategory === id && styles.chipActiveBlue]}
                      onPress={() => setEditCategory(id)}
                    >
                      <Text style={[styles.chipText, editCategory === id && styles.chipTextActive]}>
                        {CATEGORY_MAP[id]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>Color:</Text>
              <View style={styles.chipsGrid}>
                {COLORS.map((c) => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.chip, editColor === c && styles.chipActiveRed]}
                    onPress={() => setEditColor(c)}
                  >
                    <Text style={[styles.chipText, editColor === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Season:</Text>
              <View style={styles.chipsGrid}>
                {SEASONS.map((s) => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.chip, editSeason === s && styles.chipActivePurple]}
                    onPress={() => setEditSeason(s)}
                  >
                    <Text style={[styles.chipText, editSeason === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    borderTopWidth: 1,
    borderTopColor: '#F7F9FC',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  listPadding: {
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalForm: {
    flex: 1,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EDF2F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActiveBlue: {
    backgroundColor: '#2B6CB0',
    borderColor: '#2B6CB0',
  },
  chipActiveRed: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  chipActivePurple: {
    backgroundColor: '#805AD5',
    borderColor: '#805AD5',
  },
  chipText: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#38A169',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});