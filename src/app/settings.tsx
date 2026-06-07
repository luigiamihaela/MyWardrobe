import * as DocumentPicker from "expo-document-picker";
import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import ThemedButton from "../components/ThemedButton";
import { useTheme } from "../context/ThemeContext";
import db from "../database/db";
const DB_NAME = "mywardrobe_v1.db";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState("Stylist");

  useEffect(() => {
    try {
      const userRow = db.getFirstSync<{ username: string }>(
        "SELECT username FROM user_profile LIMIT 1",
      );
      if (userRow) {
        setUsername(userRow.username);
      }
    } catch (error) {
      console.error("Error loading username:", error);
    }
  }, []);

  const handleNameChange = (text: string) => {
    setUsername(text);
    try {
      db.runSync("UPDATE user_profile SET username = ? WHERE id = 1", [
        text || "Stylist",
      ]);
    } catch (error) {
      console.error("Error saving username:", error);
    }
  };
  const handleExport = async () => {
    try {
      const dbFilePath = `${documentDirectory}SQLite/${DB_NAME}`;

      const fileInfo = await getInfoAsync(dbFilePath);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Database file not found!");
        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(dbFilePath, {
        mimeType: "application/x-sqlite3",
        dialogTitle: "Backup Wardrobe Database",
      });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export database.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const pickedFile = result.assets[0];

      const dbDirectory = `${documentDirectory}SQLite/`;
      const dbFilePath = `${dbDirectory}${DB_NAME}`;

      const dirInfo = await getInfoAsync(dbDirectory);
      if (!dirInfo.exists) {
        await makeDirectoryAsync(dbDirectory, { intermediates: true });
      }

      await copyAsync({
        from: pickedFile.uri,
        to: dbFilePath,
      });

      Alert.alert("Success! 🎉", "Database restored successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(
        "Error",
        "Failed to import the database. Make sure it is a valid .db file.",
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={styles.title}>Settings ⚙️</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Manage your data and privacy.
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              marginBottom: 20,
            },
          ]}
        >
          <Text style={styles.cardTitle}>My Profile 👤</Text>
          <Text style={styles.label}>Your Name:</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={username}
            onChangeText={handleNameChange}
            placeholder="Enter your name..."
            maxLength={20}
          />
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={styles.cardTitle}>Data Portability</Text>
          <Text style={styles.cardDescription}>
            Your data is stored 100% offline on this device. You can export a
            backup of your wardrobe database to keep it safe or move it to
            another phone.
          </Text>

          <ThemedButton title="📤 Export Backup" onPress={handleExport} />

          <View style={styles.spacer} />

          <ThemedButton
            title="📥 Import Backup"
            onPress={handleImport}
            variant="outline"
          />
        </View>

        <Text style={styles.disclaimer}>
          * Note: This backup saves your items, categories, outfits, calendar
          logs, and statistics.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A202C",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 22,
    marginBottom: 24,
  },
  spacer: {
    height: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: "#A0AEC0",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});