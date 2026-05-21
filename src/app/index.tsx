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

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/collection')}
        >
          <Text style={styles.primaryButtonText}>My Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/add')}
        >
          <Text style={styles.secondaryButtonText}>+ Add a New Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineButton}
          onPress={() => router.push('/builder')}
        >
          <Text style={styles.outlineButtonText}>Create An Outfit</Text>
        </TouchableOpacity>
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
  actionContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#2B6CB0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#38A169',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2B6CB0',
  },
  outlineButtonText: {
    color: '#2B6CB0',
    fontSize: 16,
    fontWeight: '600',
  },
});