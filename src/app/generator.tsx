import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

type ClothesItem = {
  id: number;
  image_uri: string;
  category_id: number;
  season: string;
  color: string;
};

const SEASONS = ['Summer', 'Winter', 'Spring', 'Autumn', 'All Year', 'Any Season'];
const COLORS = ['Black', 'White', 'Gray', 'Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Brown', 'Beige/Cream', 'Multicolor'];
const NEUTRAL_COLORS = ['Black', 'White', 'Gray', 'Beige/Cream', 'Brown'];

export default function SmartGeneratorScreen() {
  const router = useRouter();
  
  const [selectedSeason, setSelectedSeason] = useState<string>('Summer');
  const [targetColor, setTargetColor] = useState<string>('Any Color');
  const [useColorTheory, setUseColorTheory] = useState<boolean>(true);
  const [generatedOutfit, setGeneratedOutfit] = useState<{
    top: ClothesItem | null;
    bottom: ClothesItem | null;
    dress: ClothesItem | null;
    shoes: ClothesItem | null;
    outerwear: ClothesItem | null;
  } | null>(null);

  const getRandomItem = (array: ClothesItem[]) => {
    if (array.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  };

  const generateOutfit = () => {
    try {
      const allClothes = db.getAllSync<ClothesItem>('SELECT * FROM clothes');

      const seasonClothes = selectedSeason === 'Any Season' 
        ? allClothes
        : allClothes.filter(item => item.season === selectedSeason || item.season === 'All Year');

      const tops = seasonClothes.filter(c => [1, 2, 3].includes(c.category_id));
      const bottoms = seasonClothes.filter(c => [4, 5, 6].includes(c.category_id));
      const dresses = seasonClothes.filter(c => c.category_id === 7);
      const shoes = seasonClothes.filter(c => c.category_id === 8);
      const outerwears = seasonClothes.filter(c => c.category_id === 10);

      let chosenTop: ClothesItem | null = null;
      let chosenBottom: ClothesItem | null = null;
      let chosenDress: ClothesItem | null = null;
      let chosenShoes: ClothesItem | null = null;
      let chosenOuterwear: ClothesItem | null = null;

      if (targetColor !== 'Any Color') {
        const clothesWithTargetColor = seasonClothes.filter(c => c.color === targetColor);
        if (clothesWithTargetColor.length === 0) {
          Alert.alert('Missing Clothes', `You don't have any ${targetColor} clothes for ${selectedSeason}.`);
          return;
        }
        const anchorItem = getRandomItem(clothesWithTargetColor);
        
        if (anchorItem) {
          if ([1, 2, 3].includes(anchorItem.category_id)) chosenTop = anchorItem;
          else if ([4, 5, 6].includes(anchorItem.category_id)) chosenBottom = anchorItem;
          else if (anchorItem.category_id === 7) chosenDress = anchorItem;
          else if (anchorItem.category_id === 8) chosenShoes = anchorItem;
          else if (anchorItem.category_id === 10) chosenOuterwear = anchorItem;
        }
      }

      const canMakeTwoPiece = (tops.length > 0 || chosenTop !== null) && (bottoms.length > 0 || chosenBottom !== null);
      const canMakeDress = dresses.length > 0 || chosenDress !== null;

      if (!canMakeTwoPiece && !canMakeDress) {
        Alert.alert('Not Enough Clothes', `You need either a Top+Bottom or a Dress for ${selectedSeason}.`);
        return;
      }
      if (shoes.length === 0 && !chosenShoes) {
        Alert.alert('Missing Shoes', `You don't have any shoes for ${selectedSeason}!`);
        return;
      }

      let buildDress = false;
      if (chosenDress) {
        buildDress = true;
      } else if (chosenTop || chosenBottom) {
        buildDress = false;
      } else {
        buildDress = canMakeDress && (!canMakeTwoPiece || Math.random() > 0.5) ? true : false;
      }

      if (buildDress) {
        if (!chosenDress) chosenDress = getRandomItem(dresses);
      } else {
        if (!chosenTop && !chosenBottom) {
          chosenTop = getRandomItem(tops);
          let compBottoms = bottoms;
          if (useColorTheory && chosenTop && !NEUTRAL_COLORS.includes(chosenTop.color)) {
            compBottoms = bottoms.filter(b => NEUTRAL_COLORS.includes(b.color) || b.color === chosenTop!.color);
            if (compBottoms.length === 0) compBottoms = bottoms;
          }
          chosenBottom = getRandomItem(compBottoms);
        } 
        else if (chosenTop && !chosenBottom) {
          let compBottoms = bottoms;
          if (useColorTheory && !NEUTRAL_COLORS.includes(chosenTop.color)) {
            compBottoms = bottoms.filter(b => NEUTRAL_COLORS.includes(b.color) || b.color === chosenTop!.color);
            if (compBottoms.length === 0) compBottoms = bottoms;
          }
          chosenBottom = getRandomItem(compBottoms);
        }
        else if (!chosenTop && chosenBottom) {
          let compTops = tops;
          if (useColorTheory && !NEUTRAL_COLORS.includes(chosenBottom.color)) {
            compTops = tops.filter(t => NEUTRAL_COLORS.includes(t.color) || t.color === chosenBottom!.color);
            if (compTops.length === 0) compTops = tops;
          }
          chosenTop = getRandomItem(compTops);
        }
      }

      if (!chosenShoes) chosenShoes = getRandomItem(shoes);

      if (!chosenOuterwear) {
        if ((selectedSeason === 'Winter' || selectedSeason === 'Autumn') && outerwears.length > 0) {
          chosenOuterwear = getRandomItem(outerwears);
        } else if (selectedSeason === 'Any Season' && outerwears.length > 0 && Math.random() > 0.5) {
          chosenOuterwear = getRandomItem(outerwears);
        }
      }

      setGeneratedOutfit({
        top: chosenTop,
        bottom: chosenBottom,
        dress: chosenDress,
        shoes: chosenShoes,
        outerwear: chosenOuterwear,
      });

    } catch (error) {
      console.error('Error generating outfit:', error);
    }
  };

  const renderItemCard = (item: ClothesItem | null, label: string) => {
    if (!item) return null;
    return (
      <View style={styles.itemCard}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Image source={{ uri: item.image_uri }} style={styles.itemImage} />
        <Text style={styles.colorIndicator}>{item.color}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Outfit Generator</Text>
        <Text style={styles.subtitle}>Let the App create an outfit for you.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Season:</Text>
        <View style={styles.chipsContainer}>
          {SEASONS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, selectedSeason === s && styles.chipActive]} onPress={() => setSelectedSeason(s)}>
              <Text style={[styles.chipText, selectedSeason === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Select Accent Color (Optional):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <TouchableOpacity 
            style={[styles.chip, targetColor === 'Any Color' && styles.chipActiveColor]} 
            onPress={() => setTargetColor('Any Color')}
          >
            <Text style={[styles.chipText, targetColor === 'Any Color' && styles.chipTextActive]}>Any Color</Text>
          </TouchableOpacity>
          
          {COLORS.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, targetColor === c && styles.chipActiveColor]} onPress={() => setTargetColor(c)}>
              <Text style={[styles.chipText, targetColor === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Matching Logic:</Text>
        <View style={styles.logicContainer}>
          <TouchableOpacity 
            style={[styles.logicBox, useColorTheory && styles.logicBoxActive]} 
            onPress={() => setUseColorTheory(true)}
          >
            <Text style={[styles.logicTitle, useColorTheory && styles.logicTextActive]}>Smart Match</Text>
            <Text style={[styles.logicDesc, useColorTheory && styles.logicTextActive]}>Applies Color Theory</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logicBox, !useColorTheory && styles.logicBoxActive]} 
            onPress={() => setUseColorTheory(false)}
          >
            <Text style={[styles.logicTitle, !useColorTheory && styles.logicTextActive]}>Random</Text>
            <Text style={[styles.logicDesc, !useColorTheory && styles.logicTextActive]}>No rules, only Luck</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={generateOutfit}>
        <Text style={styles.generateButtonText}>✨ Generate Outfit</Text>
      </TouchableOpacity>

      {generatedOutfit && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Your generated look:</Text>
          <View style={styles.resultGrid}>
            {renderItemCard(generatedOutfit.outerwear, 'Outerwear')}
            {renderItemCard(generatedOutfit.dress, 'Dress')}
            {renderItemCard(generatedOutfit.top, 'Top')}
            {renderItemCard(generatedOutfit.bottom, 'Bottom')}
            {renderItemCard(generatedOutfit.shoes, 'Shoes')}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC' 
},
  contentContainer: { 
    padding: 24, 
    paddingBottom: 60 
},
  header: { 
    marginBottom: 32 
},
  backButton: { 
    paddingVertical: 8, 
    marginBottom: 8 
},
  backText: { 
    fontSize: 16, 
    color: '#2B6CB0', 
    fontWeight: '600' 
},
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1A202C', 
    textAlign: 'center' 
},
  subtitle: { 
    fontSize: 16, 
    color: '#718096', 
    marginTop: 8 
},
  section: { 
    marginBottom: 32 
},
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#2D3748', 
    marginBottom: 16 
},
  chipsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
},
  horizontalScroll: { 
    paddingBottom: 8 
},
  chip: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    backgroundColor: '#EDF2F7', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 10, 
    marginBottom: 10 
},
  chipActive: { 
    backgroundColor: '#2B6CB0', 
    borderColor: '#2B6CB0' 
}, 
  chipActiveColor: { 
    backgroundColor: '#E53E3E', 
    borderColor: '#E53E3E' 
},
  chipText: { 
    color: '#4A5568', 
    fontWeight: '600' 
},
  chipTextActive: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
},
  logicContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12 
},
  logicBox: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#E2E8F0', 
    alignItems: 'center' 
},
  logicBoxActive: { 
    backgroundColor: '#805AD5', 
    borderColor: '#805AD5' 
},
  logicTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    marginBottom: 4 
},
  logicDesc: { 
    fontSize: 12, 
    color: '#718096', 
    textAlign: 'center' 
},
  logicTextActive: { 
    color: '#FFFFFF' 
},
  generateButton: { 
    backgroundColor: '#805AD5', 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    shadowColor: '#805AD5', 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 5 
},
  generateButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
},
  resultContainer: { 
    marginTop: 40, 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 20, 
    elevation: 3 
},
  resultTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    marginBottom: 20 
},
  resultGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 16 
},
  itemCard: { 
    width: 130, 
    backgroundColor: '#F7F9FC', 
    padding: 8, 
    borderRadius: 16, 
    alignItems: 'center', 
    elevation: 1 
},
  itemLabel: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#A0AEC0', 
    textTransform: 'uppercase', 
    marginBottom: 8 
},
  itemImage: { 
    width: 110, 
    height: 140, 
    borderRadius: 12, 
    backgroundColor: '#EDF2F7', 
    marginBottom: 8 
},
  colorIndicator: { 
    fontSize: 11, 
    color: '#4A5568', 
    fontStyle: 'italic', 
    fontWeight: '600' 
},
});