import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import db from '../database/db';

type ClothesItem = {
  id: number;
  image_uri: string;
  category_id: number;
};

type SlotType = 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear' | 'hat' | 'purse';

export default function OutfitBuilderScreen() {
    const router = useRouter();
    const { editId } = useLocalSearchParams();
    
  const [outfit, setOutfit] = useState<Record<SlotType, ClothesItem | null>>({
    top: null,
    bottom: null,
    dress: null,
    shoes: null,
    outerwear: null,
    hat: null,
    purse: null,
  });

  const [isModalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);
  const [availableClothes, setAvailableClothes] = useState<ClothesItem[]>([]);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitNameInput, setOutfitNameInput] = useState('');
  const [originalName, setOriginalName] = useState('');

  useEffect(() => {
    if (editId) {
      loadOutfitForEdit(Number(editId));
    }
  }, [editId]);

  const loadOutfitForEdit = (id: number) => {
    try {
      const query = `
        SELECT o.*, 
          t.image_uri as t_uri, b.image_uri as b_uri, d.image_uri as d_uri,
          s.image_uri as s_uri, out.image_uri as out_uri, h.image_uri as h_uri, p.image_uri as p_uri
        FROM outfits o
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        LEFT JOIN clothes s ON o.shoes_id = s.id
        LEFT JOIN clothes out ON o.outerwear_id = out.id
        LEFT JOIN clothes h ON o.hat_id = h.id
        LEFT JOIN clothes p ON o.purse_id = p.id
        WHERE o.id = ?
      `;
      const data = db.getFirstSync<any>(query, [id]);

      if (data) {
        setOriginalName(data.name);
        setOutfitNameInput(data.name);
        setOutfit({
          top: data.top_id ? { id: data.top_id, image_uri: data.t_uri, category_id: 0 } : null,
          bottom: data.bottom_id ? { id: data.bottom_id, image_uri: data.b_uri, category_id: 0 } : null,
          dress: data.dress_id ? { id: data.dress_id, image_uri: data.d_uri, category_id: 0 } : null,
          shoes: data.shoes_id ? { id: data.shoes_id, image_uri: data.s_uri, category_id: 0 } : null,
          outerwear: data.outerwear_id ? { id: data.outerwear_id, image_uri: data.out_uri, category_id: 0 } : null,
          hat: data.hat_id ? { id: data.hat_id, image_uri: data.h_uri, category_id: 0 } : null,
          purse: data.purse_id ? { id: data.purse_id, image_uri: data.p_uri, category_id: 0 } : null,
        });
      }
    } catch (error) {
      console.error('Error loading outfit for edit:', error);
    }
  };

  const openPicker = (slot: SlotType) => {
    setActiveSlot(slot);
    
    let catIds: number[] = [];
    if (slot === 'top') catIds = [1, 2, 3];
    else if (slot === 'bottom') catIds = [4, 5, 6];
    else if (slot === 'dress') catIds = [7];
    else if (slot === 'shoes') catIds = [8];
    else if (slot === 'outerwear') catIds = [10];
    else if (slot === 'hat') catIds = [9];
    else if (slot === 'purse') catIds = [11];

    try {
      const placeholders = catIds.map(() => '?').join(',');
      const result = db.getAllSync<ClothesItem>(
        `SELECT * FROM clothes WHERE category_id IN (${placeholders}) ORDER BY id DESC`,
        catIds
      );
      
      setAvailableClothes(result);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching clothes for picker:', error);
    }
  };

  const selectItem = (item: ClothesItem) => {
    if (activeSlot) {
      setOutfit(prev => {
        const newOutfit = { ...prev, [activeSlot]: item };
        
        if (activeSlot === 'dress') {
          newOutfit.top = null;
          newOutfit.bottom = null;
        }
        if (activeSlot === 'top' || activeSlot === 'bottom') {
          newOutfit.dress = null;
        }
        
        return newOutfit;
      });
    }
    setModalVisible(false);
  };

  const renderSlot = (title: string, slotType: SlotType) => {
    const item = outfit[slotType];
    
    const isDisabled = (outfit.dress && (slotType === 'top' || slotType === 'bottom')) ||
                       ((outfit.top || outfit.bottom) && slotType === 'dress');

    return (
      <TouchableOpacity 
        style={[styles.slot, isDisabled && styles.slotDisabled]} 
        onPress={() => !isDisabled && openPicker(slotType)}
        activeOpacity={0.7}
      >
        <Text style={styles.slotTitle}>{title}</Text>
        <View style={styles.slotImageContainer}>
          {item ? (
            <Image source={{ uri: item.image_uri }} style={styles.image} />
          ) : (
            <Text style={styles.plusSign}>+</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSaveOutfit = () => {
    const hasTopAndBottom = outfit.top !== null && outfit.bottom !== null;
    const hasDress = outfit.dress !== null;
    const hasShoes = outfit.shoes !== null;

    if (!(hasTopAndBottom || hasDress)) {
      Alert.alert('Incomplete Outfit', 'An outfit needs either a Top + Bottom or a Dress.');
      return;
    }

    if (!hasShoes) {
      Alert.alert('Missing Shoes', 'Please select a pair of shoes for this outfit.');
      return;
    }

    if (editId) {
      if (outfitNameInput.trim() === '') {
        setOutfitNameInput(originalName);
      }
    } else {
      setOutfitNameInput('');
    }

    setSaveModalVisible(true);
  };

  const executeSave = (outfitName: string) => {
    try {
        if (editId) {
        db.runSync(
          `UPDATE outfits SET name=?, dress_id=?, top_id=?, bottom_id=?, shoes_id=?, outerwear_id=?, hat_id=?, purse_id=? WHERE id=?`,
          [
            outfitName,
            outfit.dress?.id || null,
            outfit.top?.id || null,
            outfit.bottom?.id || null,
            outfit.shoes?.id || null,
            outfit.outerwear?.id || null,
            outfit.hat?.id || null,
            outfit.purse?.id || null,
            Number(editId)
          ]
        );
        Alert.alert('Updated!', 'Outfit changes have been saved.');
        router.back();
      } else {
      db.runSync(
        `INSERT INTO outfits (name, dress_id, top_id, bottom_id, shoes_id, outerwear_id, hat_id, purse_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          outfitName,
          outfit.dress?.id || null,
          outfit.top?.id || null,
          outfit.bottom?.id || null,
          outfit.shoes?.id || null,
          outfit.outerwear?.id || null,
          outfit.hat?.id || null,
          outfit.purse?.id || null,
        ]
      );

      Alert.alert('Success!', `Outfit "${outfitName}" was saved to your wardrobe.`);
      
      setOutfit({
        top: null, 
        bottom: null, 
        dress: null, 
        shoes: null, 
        outerwear: null, 
        hat: null, 
        purse: null,
      });
    }} catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('Error', 'Could not save the outfit.');
    }
  };

  return (
    <>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{editId ? 'Edit Outfit' : 'Create An Outfit'}</Text>
        </View>

        <View style={styles.grid}>
          {renderSlot('Top', 'top')}
          {renderSlot('Bottom', 'bottom')}
          {renderSlot('Dress', 'dress')}
          {renderSlot('Shoes', 'shoes')}
          {renderSlot('Outerwear', 'outerwear')}
          {renderSlot('Hat/Cap', 'hat')}
          {renderSlot('Purse/Bag', 'purse')}
        </View>

        <TouchableOpacity style={styles.saveOutfitButton} onPress={handleSaveOutfit}>
          <Text style={styles.saveOutfitText}>{editId ? 'Save Changes' : 'Save Outfit'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            {availableClothes.length === 0 ? (
              <Text style={styles.emptyText}>You don't have any clothes in this category yet.</Text>
            ) : (
              <FlatList
                data={availableClothes}
                keyExtractor={(item: ClothesItem) => item.id.toString()}
                numColumns={3}
                renderItem={({ item }: { item: ClothesItem }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => selectItem(item)}>
                    <Image source={{ uri: item.image_uri }} style={styles.modalImage} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isSaveModalVisible} animationType="fade" transparent={true}>
        <View style={styles.saveModalOverlay}>
          <View style={styles.saveModalContent}>
            <Text style={styles.saveModalTitle}>Save Outfit</Text>
            <Text style={styles.saveModalSubtitle}>Give your outfit a name:</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Summer Casual"
              value={outfitNameInput}
              onChangeText={setOutfitNameInput}
              autoFocus={true}
            />

            <View style={styles.saveModalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSaveModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={() => {
                  setSaveModalVisible(false);
                  const finalName = outfitNameInput.trim() || originalName || `Outfit #${Date.now().toString().slice(-4)}`;
                  executeSave(finalName);
                }}
              >
                <Text style={styles.confirmBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slot: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  slotDisabled: {
    opacity: 0.4,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
    textAlign: 'center',
  },
  slotImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  plusSign: {
    fontSize: 32,
    color: '#A0AEC0',
    fontWeight: '300',
  },
  saveOutfitButton: {
    backgroundColor: '#38A169',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  saveOutfitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 16,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    color: '#E53E3E',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 32,
  },
  modalItem: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EDF2F7',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  saveModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveModalSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F7F9FC',
    marginBottom: 24,
  },
  saveModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#38A169',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});