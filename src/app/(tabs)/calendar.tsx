import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import db from "../../database/db";

type OutfitItem = {
  id: number;
  name: string;
};

const formatDateForDB = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
};

const getDayName = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short" });

const getDayNumber = (d: Date) => d.getDate().toString();

const getMonthName = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short" });

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [daysRangeStr, setDaysRangeStr] = useState("15");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [loggedOutfit, setLoggedOutfit] = useState<any | null>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [availableOutfits, setAvailableOutfits] = useState<OutfitItem[]>([]);

  const [isJumpModalVisible, setJumpModalVisible] = useState(false);
  const [jumpDay, setJumpDay] = useState("");
  const [jumpMonth, setJumpMonth] = useState("");
  const [jumpYear, setJumpYear] = useState("");

  useEffect(() => {
    const parsed = parseInt(daysRangeStr);
    const limit = isNaN(parsed) ? 0 : Math.min(parsed, 365);

    const newDates = [];
    for (let i = -limit; i <= limit; i++) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() + i);
      newDates.push(d);
    }
    setDates(newDates);
  }, [daysRangeStr, anchorDate]);

  useFocusEffect(
    useCallback(() => {
      loadLoggedOutfit(selectedDate);
    }, [selectedDate]),
  );

  const loadLoggedOutfit = (date: Date) => {
    if (!date) return;
    try {
      if (!db) return;
      const dateStr = formatDateForDB(date);
      const query = `
        SELECT o.*, 
          t.image_uri AS t_uri, b.image_uri AS b_uri, d.image_uri AS d_uri,
          s.image_uri AS s_uri, out.image_uri AS out_uri, h.image_uri AS h_uri, p.image_uri AS p_uri
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        LEFT JOIN clothes s ON o.shoes_id = s.id
        LEFT JOIN clothes out ON o.outerwear_id = out.id
        LEFT JOIN clothes h ON o.hat_id = h.id
        LEFT JOIN clothes p ON o.purse_id = p.id
        WHERE l.date = ?
      `;
      const result = db.getFirstSync<any>(query, [dateStr]);

      if (result) {
        const allImages = [
          result.d_uri,
          result.t_uri,
          result.b_uri,
          result.s_uri,
          result.out_uri,
          result.h_uri,
          result.p_uri,
        ].filter((img) => img != null);

        setLoggedOutfit({ ...result, images: allImages });
      } else {
        setLoggedOutfit(null);
      }
    } catch (error) {
      console.log("Safe fallback triggered. Error fetching log:", error);
      setLoggedOutfit(null);
    }
  };

  const openOutfitSelector = () => {
    try {
      const outfits = db.getAllSync<OutfitItem>(
        "SELECT id, name FROM outfits ORDER BY id DESC",
      ) as OutfitItem[];
      setAvailableOutfits(outfits);
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching outfits:", error);
    }
  };

  const logOutfit = (outfitId: number) => {
    const dateStr = formatDateForDB(selectedDate);
    try {
      db.runSync("DELETE FROM outfit_logs WHERE date = ?", [dateStr]);
      db.runSync("INSERT INTO outfit_logs (date, outfit_id) VALUES (?, ?)", [
        dateStr,
        outfitId,
      ]);

      setModalVisible(false);
      loadLoggedOutfit(selectedDate);
    } catch (error) {
      console.error("Error saving log:", error);
    }
  };

  const removeLog = () => {
    const dateStr = formatDateForDB(selectedDate);
    Alert.alert(
      "Remove Outfit",
      "Are you sure you want to clear the outfit for this day?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            db.runSync("DELETE FROM outfit_logs WHERE date = ?", [dateStr]);
            setLoggedOutfit(null);
          },
        },
      ],
    );
  };

  const handleJumpToDate = () => {
    const d = parseInt(jumpDay);
    const m = parseInt(jumpMonth);
    const y = parseInt(jumpYear);

    if (!d || !m || !y || d > 31 || m > 12 || y < 1900 || y > 2100) {
      Alert.alert("Invalid Date", "Please enter a valid day, month, and year.");
      return;
    }

    const newDate = new Date(y, m - 1, d);

    if (isNaN(newDate.getTime())) {
      Alert.alert("Error", "Could not parse date.");
      return;
    }

    setAnchorDate(newDate);
    setSelectedDate(newDate);
    setJumpModalVisible(false);
    setJumpDay("");
    setJumpMonth("");
    setJumpYear("");
  };

  const renderDateBox = ({ item: d }: { item: Date }) => {
    const isSelected = formatDateForDB(d) === formatDateForDB(selectedDate);
    const isToday = formatDateForDB(d) === formatDateForDB(new Date());
    const isFirstDayOfMonth = d.getDate() === 1;

    return (
      <View style={styles.dateWrapper}>
        <Text style={[styles.monthLabel, { color: theme.primary }]}>
          {isFirstDayOfMonth ? getMonthName(d) : " "}
        </Text>

        <TouchableOpacity
          style={[
            styles.dateBox,
            { backgroundColor: theme.background, borderColor: theme.border },
            isSelected && {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
            isToday &&
              !isSelected && { borderColor: theme.primary, borderWidth: 2 },
          ]}
          onPress={() => setSelectedDate(d)}
        >
          <Text
            style={[
              styles.dayName,
              { color: theme.subtext },
              isSelected && styles.textWhite,
            ]}
          >
            {getDayName(d)}
          </Text>
          <Text
            style={[
              styles.dayNumber,
              { color: theme.text },
              isSelected && styles.textWhite,
            ]}
          >
            {getDayNumber(d)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Outfit Diary</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Track what you wear every day.
        </Text>

        <View style={styles.controlsRow}>
          <View
            style={[
              styles.filterContainer,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.filterLabel, { color: theme.text }]}>
              Range (±):
            </Text>
            <TextInput
              style={[
                styles.filterInput,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              keyboardType="numeric"
              value={daysRangeStr}
              onChangeText={(text: string) =>
                setDaysRangeStr(text.replace(/[^0-9]/g, ""))
              }
              maxLength={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.jumpBtn, { backgroundColor: theme.primary }]}
            onPress={() => setJumpModalVisible(true)}
          >
            <Text style={styles.jumpBtnText}>📅 Jump to Date</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.calendarContainer,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <FlatList
          data={dates}
          keyExtractor={(item: Date) => formatDateForDB(item)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScroll}
          renderItem={renderDateBox}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.selectedDateText, { color: theme.text }]}>
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {loggedOutfit ? (
          <View
            style={[
              styles.loggedCard,
              { backgroundColor: theme.card, shadowColor: theme.primary },
            ]}
          >
            <Text
              style={[styles.loggedName, { color: theme.text }]}
              numberOfLines={2}
            >
              {loggedOutfit.name}
            </Text>

            <View style={styles.previewGrid}>
              {loggedOutfit.images?.map((imgUri: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imgUri }}
                  style={[
                    styles.previewImage,
                    { backgroundColor: theme.border },
                  ]}
                />
              ))}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.changeBtn, { backgroundColor: theme.iconBtn }]}
                onPress={openOutfitSelector}
              >
                <Text style={[styles.changeBtnText, { color: theme.primary }]}>
                  Change Outfit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.removeBtn,
                  { backgroundColor: theme.background },
                ]}
                onPress={removeLog}
              >
                <Text style={styles.removeBtnText}>Clear Day</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              You haven't logged an outfit for this day.
            </Text>
            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: theme.primary }]}
              onPress={openOutfitSelector}
            >
              <Text style={styles.logButtonText}>+ Log an Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select from Saved Outfits
            </Text>

            {availableOutfits.length === 0 ? (
              <Text style={[styles.noOutfitsText, { color: theme.subtext }]}>
                You don't have any saved outfits yet.
              </Text>
            ) : (
              <FlatList
                data={availableOutfits}
                keyExtractor={(item: OutfitItem) => item.id.toString()}
                renderItem={({ item }: { item: OutfitItem }) => (
                  <TouchableOpacity
                    style={[
                      styles.outfitItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => logOutfit(item.id)}
                  >
                    <Text
                      style={[styles.outfitItemName, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.selectText, { color: theme.primary }]}>
                      Select
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.iconBtn }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.closeBtnText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isJumpModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlayJump}>
          <View style={[styles.jumpContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Time Travel 🕰️
            </Text>
            <Text style={[styles.subtitleJump, { color: theme.subtext }]}>
              Enter the exact date you want to visit.
            </Text>

            <View style={styles.jumpInputsRow}>
              <TextInput
                placeholderTextColor={theme.subtext}
                style={[
                  styles.jumpInput,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.text,
                  },
                ]}
                placeholder="DD"
                keyboardType="numeric"
                maxLength={2}
                value={jumpDay}
                onChangeText={(t: string) =>
                  setJumpDay(t.replace(/[^0-9]/g, ""))
                }
              />
              <Text style={[styles.slash, { color: theme.subtext }]}>/</Text>
              <TextInput
                placeholderTextColor={theme.subtext}
                style={[
                  styles.jumpInput,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.text,
                  },
                ]}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                value={jumpMonth}
                onChangeText={(t: string) =>
                  setJumpMonth(t.replace(/[^0-9]/g, ""))
                }
              />
              <Text style={[styles.slash, { color: theme.subtext }]}>/</Text>
              <TextInput
                placeholderTextColor={theme.subtext}
                style={[
                  styles.jumpInputYear,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.text,
                  },
                ]}
                placeholder="YYYY"
                keyboardType="numeric"
                maxLength={4}
                value={jumpYear}
                onChangeText={(t: string) =>
                  setJumpYear(t.replace(/[^0-9]/g, ""))
                }
              />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.cancelJumpBtn,
                  { backgroundColor: theme.iconBtn },
                ]}
                onPress={() => setJumpModalVisible(false)}
              >
                <Text style={[styles.cancelJumpText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmJumpBtn,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleJumpToDate}
              >
                <Text style={styles.confirmJumpText}>Go!</Text>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
    borderWidth: 1,
    height: 46,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
    height: 30,
    padding: 0,
  },
  jumpBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    height: 46,
  },
  jumpBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  calendarContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    minHeight: 120,
  },
  calendarScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dateWrapper: {
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "bold",
    height: 16,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  dateBox: {
    width: 60,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textWhite: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  logButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    elevation: 3,
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loggedCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loggedName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  previewGrid: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  previewImage: {
    width: 65,
    height: 85,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  changeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  changeBtnText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  removeBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  removeBtnText: {
    color: "#E53E3E",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  outfitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  outfitItemName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  selectText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  noOutfitsText: {
    textAlign: "center",
    marginTop: 40,
  },
  closeBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  closeBtnText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlayJump: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  jumpContent: {
    width: "85%",
    borderRadius: 24,
    padding: 24,
    elevation: 5,
  },
  subtitleJump: {
    textAlign: "center",
    marginBottom: 24,
  },
  jumpInputsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  jumpInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    width: 60,
  },
  jumpInputYear: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    width: 80,
  },
  slash: {
    fontSize: 24,
    fontWeight: "bold",
  },
  cancelJumpBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelJumpText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmJumpBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmJumpText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
