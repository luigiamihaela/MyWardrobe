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
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
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
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <Text style={[styles.title, { color: theme.text }]}>Add a New Item</Text>

      <View style={[styles.imageContainer, { backgroundColor: theme.border }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={[styles.placeholderText, { color: theme.subtext }]}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {imageUri ? "Change Photo" : "Open Gallery"}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.filtersContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category:</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    categoryId === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: theme.subtext },
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
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Season:</Text>
            <View style={styles.chipsContainer}>
              {SEASONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    season === s && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setSeason(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: theme.subtext },
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
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Color:</Text>
            <View style={styles.chipsContainer}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    color === c && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setColor(c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: theme.subtext },
                      color === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={saveItem}>
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
    textAlign: "center",
  },
  imageContainer: {
    width: 250,
    height: 330,
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
    fontSize: 16,
  },
  button: {
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
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  saveButton: {
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