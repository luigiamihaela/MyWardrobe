import React, { createContext, useContext, useState } from 'react';

export const pinkTheme = {
  name: 'pink',
  primary: '#D53F8C',
  background: '#FFF5F7',
  card: '#FFFFFF',
  text: '#1A202C',
  subtext: '#702459',
  border: '#FED7E2',
  iconBtn: '#FED7E2',
};

export const blueTheme = {
  name: 'blue',
  primary: '#2B6CB0',
  background: '#EBF8FF',
  card: '#FFFFFF',
  text: '#1A202C',
  subtext: '#2C5282',
  border: '#BEE3F8',
  iconBtn: '#BEE3F8',
};

type Theme = typeof pinkTheme;
type ThemeContextType = {
  theme: Theme;
  isPink: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isPink, setIsPink] = useState(true);

  const toggleTheme = () => {
    setIsPink((prev) => !prev);
  };

  const currentTheme = isPink ? pinkTheme : blueTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isPink, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}