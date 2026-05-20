import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
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

  const saveItem = async () => {
    if (!imageUri) {
      return;
    }

    try {
      db.runSync(
        'INSERT INTO clothes (image_uri, category_id, color, season) VALUES (?, ?, ?, ?)',
        [imageUri, null, null, null]
      );

      Alert.alert('Success!', 'The item was added to your DB.');
      
      setImageUri(null);
      router.back();

    } catch (error) {
      console.error('Error saving in database:', error);
      Alert.alert('Error', 'Could not save the item.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a New Item</Text>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Open Gallery</Text>
      </TouchableOpacity>

      {imageUri && (
        <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
          <Text style={styles.saveButtonText}>Save to Wardrobe</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: '#F7F9FC', 
    alignItems: 'center' 
},
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 32, 
    color: '#1A202C' 
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
    marginBottom: 16 
},
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
},
  saveButton: { 
    backgroundColor: '#38A169', 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center' 
},
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
},
});