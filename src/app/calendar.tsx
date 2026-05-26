import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

type OutfitItem = {
  id: number;
  name: string;
};

const formatDateForDB = (d: Date) => d.toISOString().split('T')[0];
const getDayName = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
const getDayNumber = (d: Date) => d.getDate().toString();
const getMonthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });

export default function CalendarScreen() {
  const router = useRouter();
  
  const [daysRangeStr, setDaysRangeStr] = useState<string>('15');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [loggedOutfit, setLoggedOutfit] = useState<any | null>(null);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [availableOutfits, setAvailableOutfits] = useState<OutfitItem[]>([]);

  const [isJumpModalVisible, setJumpModalVisible] = useState(false);
  const [jumpDay, setJumpDay] = useState('');
  const [jumpMonth, setJumpMonth] = useState('');
  const [jumpYear, setJumpYear] = useState('');

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
    }, [selectedDate])
  );

  const loadLoggedOutfit = (date: Date) => {
    const dateStr = formatDateForDB(date);
    try {
      const query = `
        SELECT o.*, 
          t.image_uri AS t_uri, b.image_uri AS b_uri, d.image_uri AS d_uri
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        WHERE l.date = ?
      `;
      const result = db.getFirstSync<any>(query, [dateStr]);
      setLoggedOutfit(result || null);
    } catch (error) {
      console.error('Error fetching log:', error);
    }
  };

  const openOutfitSelector = () => {
    try {
      const outfits = db.getAllSync<OutfitItem>('SELECT id, name FROM outfits ORDER BY id DESC');
      setAvailableOutfits(outfits);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching outfits:', error);
    }
  };

  const logOutfit = (outfitId: number) => {
    const dateStr = formatDateForDB(selectedDate);
    try {
      db.runSync('DELETE FROM outfit_logs WHERE date = ?', [dateStr]);
      db.runSync('INSERT INTO outfit_logs (date, outfit_id) VALUES (?, ?)', [dateStr, outfitId]);
      
      setModalVisible(false);
      loadLoggedOutfit(selectedDate);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const removeLog = () => {
    const dateStr = formatDateForDB(selectedDate);
    Alert.alert('Remove Outfit', 'Are you sure you want to clear the outfit for this day?', [
      { 
        text: 'Cancel', 
        style: 'cancel' 
      },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM outfit_logs WHERE date = ?', [dateStr]);
          setLoggedOutfit(null);
        }
      }
    ]);
  };

  const handleJumpToDate = () => {
    const d = parseInt(jumpDay);
    const m = parseInt(jumpMonth);
    const y = parseInt(jumpYear);

    if (!d || !m || !y || d > 31 || m > 12 || y < 1900 || y > 2100) {
      Alert.alert('Invalid Date', 'Please enter a valid day, month, and year.');
      return;
    }

    const newDate = new Date(y, m - 1, d);
    
    if (isNaN(newDate.getTime())) {
      Alert.alert('Error', 'Could not parse date.');
      return;
    }

    setAnchorDate(newDate);
    setSelectedDate(newDate);
    setJumpModalVisible(false);
    setJumpDay('');
    setJumpMonth('');
    setJumpYear('');
  };

  const renderDateBox = ({ item: d }: { item: Date }) => {
    const isSelected = formatDateForDB(d) === formatDateForDB(selectedDate);
    const isToday = formatDateForDB(d) === formatDateForDB(new Date());
    const isFirstDayOfMonth = d.getDate() === 1;

    return (
      <View style={styles.dateWrapper}>
        <Text style={styles.monthLabel}>
          {isFirstDayOfMonth ? getMonthName(d) : ' '}
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.dateBox, 
            isSelected && styles.dateBoxSelected, 
            isToday && !isSelected && styles.dateBoxToday
          ]}
          onPress={() => setSelectedDate(d)}
        >
          <Text style={[styles.dayName, isSelected && styles.textWhite]}>
            {getDayName(d)}
          </Text>
          <Text style={[styles.dayNumber, isSelected && styles.textWhite]}>
            {getDayNumber(d)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        
        <Text style={styles.title}>Outfit Diary 🎀</Text>
        <Text style={styles.subtitle}>Track what you wear every day.</Text>
        
        <View style={styles.controlsRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Range (±):</Text>
            <TextInput
              style={styles.filterInput}
              keyboardType="numeric"
              value={daysRangeStr}
              onChangeText={(text: string) => setDaysRangeStr(text.replace(/[^0-9]/g, ''))}
              maxLength={3}
            />
          </View>

          <TouchableOpacity style={styles.jumpBtn} onPress={() => setJumpModalVisible(true)}>
            <Text style={styles.jumpBtnText}>📅 Jump to Date</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
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
        <Text style={styles.selectedDateText}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>

        {loggedOutfit ? (
          <View style={styles.loggedCard}>
            <Text style={styles.loggedName} numberOfLines={2}>{loggedOutfit.name}</Text>
            
            <View style={styles.previewGrid}>
              {loggedOutfit.d_uri && <Image source={{ uri: loggedOutfit.d_uri }} style={styles.previewImage} />}
              {loggedOutfit.t_uri && <Image source={{ uri: loggedOutfit.t_uri }} style={styles.previewImage} />}
              {loggedOutfit.b_uri && <Image source={{ uri: loggedOutfit.b_uri }} style={styles.previewImage} />}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.changeBtn} onPress={openOutfitSelector}>
                <Text style={styles.changeBtnText}>Change Outfit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={removeLog}>
                <Text style={styles.removeBtnText}>Clear Day</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't logged an outfit for this day.</Text>
            <TouchableOpacity style={styles.logButton} onPress={openOutfitSelector}>
              <Text style={styles.logButtonText}>+ Log an Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select from Saved Outfits</Text>
            
            {availableOutfits.length === 0 ? (
              <Text style={styles.noOutfitsText}>You don't have any saved outfits yet.</Text>
            ) : (
              <FlatList
                data={availableOutfits}
                keyExtractor={(item: OutfitItem) => item.id.toString()}
                renderItem={({ item }: { item: OutfitItem }) => (
                  <TouchableOpacity style={styles.outfitItem} onPress={() => logOutfit(item.id)}>
                    <Text style={styles.outfitItemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.selectText}>Select</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isJumpModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayJump}>
          <View style={styles.jumpContent}>
            <Text style={styles.modalTitle}>Time Travel 🕰️</Text>
            <Text style={styles.subtitleJump}>Enter the exact date you want to visit.</Text>
            
            <View style={styles.jumpInputsRow}>
              <TextInput style={styles.jumpInput} placeholder="DD" keyboardType="numeric" maxLength={2} value={jumpDay} onChangeText={(t: string) => setJumpDay(t.replace(/[^0-9]/g, ''))} />
              <Text style={styles.slash}>/</Text>
              <TextInput style={styles.jumpInput} placeholder="MM" keyboardType="numeric" maxLength={2} value={jumpMonth} onChangeText={(t: string) => setJumpMonth(t.replace(/[^0-9]/g, ''))} />
              <Text style={styles.slash}>/</Text>
              <TextInput style={styles.jumpInputYear} placeholder="YYYY" keyboardType="numeric" maxLength={4} value={jumpYear} onChangeText={(t: string) => setJumpYear(t.replace(/[^0-9]/g, ''))} />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelJumpBtn} onPress={() => setJumpModalVisible(false)}>
                <Text style={styles.cancelJumpText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmJumpBtn} onPress={handleJumpToDate}>
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
    backgroundColor: '#FFF5F7',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7E2',
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#D53F8C',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#702459',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FED7E2',
    height: 46,
  },
  filterLabel: {
    fontSize: 14,
    color: '#702459',
    fontWeight: '600',
  },
  filterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7E2',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A202C',
    width: 50,
    textAlign: 'center',
    height: 30,
    padding: 0,
  },
  jumpBtn: {
    backgroundColor: '#D53F8C',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    height: 46,
  },
  jumpBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calendarContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7E2',
    elevation: 2,
    minHeight: 120,
  },
  calendarScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dateWrapper: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D53F8C',
    height: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateBox: {
    width: 60,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7E2',
  },
  dateBoxToday: {
    borderColor: '#D53F8C',
    borderWidth: 2,
  },
  dateBoxSelected: {
    backgroundColor: '#D53F8C',
    borderColor: '#D53F8C',
  },
  dayName: {
    fontSize: 14,
    color: '#702459',
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    color: '#1A202C',
    fontWeight: 'bold',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FED7E2',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#702459',
    textAlign: 'center',
    marginBottom: 24,
  },
  logButton: {
    backgroundColor: '#D53F8C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    elevation: 3,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loggedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#D53F8C',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loggedName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  previewImage: {
    width: 80,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  changeBtn: {
    flex: 1,
    backgroundColor: '#FED7E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeBtnText: {
    color: '#D53F8C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  removeBtn: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  removeBtnText: {
    color: '#E53E3E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 20,
    textAlign: 'center',
  },
  outfitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  outfitItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 12,
  },
  selectText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D53F8C',
  },
  noOutfitsText: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 40,
  },
  closeBtn: {
    marginTop: 24,
    backgroundColor: '#EDF2F7',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#4A5568',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlayJump: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jumpContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
  },
  subtitleJump: {
    textAlign: 'center',
    color: '#702459',
    marginBottom: 24,
  },
  jumpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  jumpInput: {
    borderWidth: 1,
    borderColor: '#FED7E2',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    width: 60,
    backgroundColor: '#FFF5F7',
  },
  jumpInputYear: {
    borderWidth: 1,
    borderColor: '#FED7E2',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    width: 80,
    backgroundColor: '#FFF5F7',
  },
  slash: {
    fontSize: 24,
    color: '#A0AEC0',
    fontWeight: 'bold',
  },
  cancelJumpBtn: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelJumpText: {
    color: '#4A5568',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmJumpBtn: {
    flex: 1,
    backgroundColor: '#D53F8C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmJumpText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});