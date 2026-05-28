import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ThemedButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
};

export default function ThemedButton({ title, onPress, variant = 'solid' }: ThemedButtonProps) {
  const { theme } = useTheme();

  const buttonStyle = variant === 'solid' 
    ? [styles.button, { backgroundColor: theme.primary }] 
    : [styles.buttonOutline, { borderColor: theme.primary }];

  const textStyle = variant === 'solid' 
    ? styles.textSolid 
    : [styles.textOutline, { color: theme.primary }];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    elevation: 2,
  },
  buttonOutline: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  textSolid: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textOutline: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});