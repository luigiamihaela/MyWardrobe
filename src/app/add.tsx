import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

const CATEGORIES = [
  { id: 1, label: 'Top' },
  { id: 2, label: 'Bottom' },
  { id: 3, label: 'Shoes' },
  { id: 4, label: 'Outerwear' }
];

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null); 
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to add clothes!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const imageText = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(imageText);
    }
  };

  const saveItem = () => {
    if (!imageUri) {
      Alert.alert('Missing Image', 'Please select an image from your gallery.');
      return; 
    }
    if (!categoryId) {
      Alert.alert('Missing Category', 'Please select a category for this item.');
      return;
    }

    try {
      db.runSync(
        'INSERT INTO clothes (image_uri, category_id, color, season) VALUES (?, ?, ?, ?)',
        [imageUri, categoryId, null, null]
      );

      Alert.alert('Success!', 'The item was added to your DB.');
      
      setImageUri(null);
      setCategoryId(null);
      router.back();

    } catch (error) {
      console.error('Error saving in database:', error);
      Alert.alert('Error', 'Could not save the item.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
      <Text style={styles.title}>Add a New Item</Text>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>{imageUri ? 'Change Photo' : 'Open Gallery'}</Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Select Category:</Text>
          <View style={styles.chipsContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  categoryId === cat.id && styles.chipActive
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[
                  styles.chipText,
                  categoryId === cat.id && styles.chipTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {imageUri && categoryId && (
        <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
          <Text style={styles.saveButtonText}>Save to Wardrobe</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 24,
    backgroundColor: '#F7F9FC', 
    alignItems: 'center', 
    paddingBottom: 40 
  },
  header: { 
    width: '100%', 
    alignItems: 'flex-start', 
    marginBottom: 16, 
    marginTop: 10 
  },
  backButton: { 
    paddingVertical: 8, 
    paddingRight: 16 
  },
  backText: { 
    fontSize: 16, 
    color: '#2B6CB0', 
    fontWeight: '600' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    color: '#1A202C', 
    textAlign: 'center' 
  },
  imageContainer: { 
    width: 250, 
    height: 330, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24, 
    overflow: 'hidden' 
},
  image: { 
    width: '100%',
    height: '100%' 
},
  placeholderText: { 
    color: '#A0AEC0', 
    fontSize: 16 
},
  button: { 
    backgroundColor: '#2B6CB0', 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  categorySection: { 
    width: '100%', 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#4A5568', 
    marginBottom: 12 
  },
  chipsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  chip: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    backgroundColor: '#EDF2F7', 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  chipActive: { 
    backgroundColor: '#2B6CB0',
    borderColor: '#2B6CB0'
  },
  chipText: { 
    color: '#4A5568', 
    fontWeight: '500' 
  },
  chipTextActive: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  saveButton: { 
    backgroundColor: '#38A169', 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center', 
    marginTop: 10 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
},
});