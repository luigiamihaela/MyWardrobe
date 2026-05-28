import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ThemedCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function ThemedCard({ children, style }: ThemedCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.card, 
        borderColor: theme.border 
      }, 
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});