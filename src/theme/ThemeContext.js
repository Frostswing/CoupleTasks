import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, navLight, navDark } from './colors';

const STORAGE_KEY = 'app_theme';

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  navTheme: navLight,
  toggle: () => {},
  setDark: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setIsDark(saved === 'dark');
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light').catch(() => {});
  }, [isDark, loaded]);

  const value = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    navTheme: isDark ? navDark : navLight,
    toggle: () => setIsDark(prev => !prev),
    setDark: (val) => setIsDark(!!val),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);