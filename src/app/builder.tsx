import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

type ClothesItem = {
  id: number;
  image_uri: string;
  category_id: number;
};

type SlotType = 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear' | 'hat' | 'purse';

export default function OutfitBuilderScreen() {
  const router = useRouter();

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

    setOutfitNameInput('');
    setSaveModalVisible(true);
  };

  const executeSave = (outfitName: string) => {
    try {
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
      
      router.back();
    } catch (error) {
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
          <Text style={styles.title}>Create An Outfit</Text>
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
          <Text style={styles.saveOutfitText}>Save Outfit</Text>
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
                  const finalName = outfitNameInput.trim() || `My Outfit #${Date.now().toString().slice(-4)}`;
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