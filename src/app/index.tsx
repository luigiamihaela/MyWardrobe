import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.subtitle}>What would you like to wear today?</Text>
      </View>

      <View style={styles.buttonsContainer}>
        
        <View style={styles.group}>
          <TouchableOpacity style={styles.solidButtonBlue} onPress={() => router.push('/add')}>
            <Text style={styles.solidButtonText}>+ Add a New Item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButtonBlue} onPress={() => router.push('/collection')}>
            <Text style={styles.outlineButtonTextBlue}>My Collection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.solidButtonGreen} onPress={() => router.push('/builder')}>
            <Text style={styles.solidButtonText}>+ Create An Outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButtonGreen} onPress={() => router.push('/outfits')}>
            <Text style={styles.outlineButtonTextGreen}>My Outfits</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.solidButtonPurple} onPress={() => router.push('/generator')}>
            <Text style={styles.solidButtonText}>Outfit Generator</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.solidButtonPink} onPress={() => router.push('/calendar')}>
            <Text style={styles.solidButtonText}>Outfit Diary 🌸</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButtonPink} onPress={() => router.push('/insights')}>
            <Text style={styles.outlineButtonTextPink}>Wardrobe Insights 📊</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#718096',
  },
  buttonsContainer: {
    width: '100%',
  },
  group: {
    marginBottom: 12,
  },
  solidButtonBlue: {
    backgroundColor: '#2B6CB0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  outlineButtonBlue: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2B6CB0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonTextBlue: {
    color: '#2B6CB0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  solidButtonGreen: {
    backgroundColor: '#38A169',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  outlineButtonGreen: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#38A169',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonTextGreen: {
    color: '#38A169',
    fontSize: 16,
    fontWeight: 'bold',
  },
  solidButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  solidButtonPurple: {
    backgroundColor: '#805AD5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  solidButtonPink: {
    backgroundColor: '#D53F8C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#D53F8C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  outlineButtonPink: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D53F8C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineButtonTextPink: {
    color: '#D53F8C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});