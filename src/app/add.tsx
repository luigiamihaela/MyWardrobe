import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import db from "../database/db";

const CATEGORIES = [
  { id: 1, label: "Tshirt" },
  { id: 2, label: "Top" },
  { id: 3, label: "Blouse" },
  { id: 4, label: "Jeans" },
  { id: 5, label: "Pants" },
  { id: 6, label: "Skirt" },
  { id: 7, label: "Dress" },
  { id: 8, label: "Shoes" },
  { id: 9, label: "Hat" },
  { id: 10, label: "Jacket" },
  { id: 11, label: "Purse" },
];

const SEASONS = ["Summer", "Winter", "Spring", "Autumn", "All Year"];

const COLORS = [
  "Black",
  "White",
  "Gray",
  "Blue",
  "Red",
  "Green",
  "Yellow",
  "Purple",
  "Pink",
  "Orange",
  "Brown",
  "Beige/Cream",
  "Multicolor",
];
export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your gallery to add clothes!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
      Alert.alert("Missing Image", "Please select an image from your gallery.");
      return;
    }
    if (!categoryId) {
      Alert.alert(
        "Missing Category",
        "Please select a category for this item.",
      );
      return;
    }
    if (!season) {
      Alert.alert("Missing Info", "Please select a season.");
      return;
    }
    if (!color) {
      Alert.alert("Missing Info", "Please select a color.");
      return;
    }

    try {
      db.runSync(
        "INSERT INTO clothes (image_uri, category_id, color, season) VALUES (?, ?, ?, ?)",
        [imageUri, categoryId, color, season],
      );

      Alert.alert("Congrats!", "A new item was added to your collection.");

      setImageUri(null);
      setCategoryId(null);
      setSeason(null);
      setColor(null);
    } catch (error) {
      console.error("Error saving in the database:", error);
      Alert.alert("Error", "Could not save the item.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.title}>Add a New Item</Text>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {imageUri ? "Change Photo" : "Open Gallery"}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.filtersContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category:</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    categoryId === cat.id && styles.chipActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === cat.id && styles.chipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Season:</Text>
            <View style={styles.chipsContainer}>
              {SEASONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, season === s && styles.chipActive]}
                  onPress={() => setSeason(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      season === s && styles.chipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color:</Text>
            <View style={styles.chipsContainer}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, color === c && styles.chipActive]}
                  onPress={() => setColor(c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      color === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
            <Text style={styles.saveButtonText}>Save to Wardrobe</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  contentContainer: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#1A202C",
    textAlign: "center",
  },
  imageContainer: {
    width: 250,
    height: 330,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderText: {
    color: "#A0AEC0",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2B6CB0",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  filtersContainer: {
    width: "100%",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#EDF2F7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#2B6CB0",
    borderColor: "#2B6CB0",
  },
  chipText: {
    color: "#4A5568",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#38A169",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});