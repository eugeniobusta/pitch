import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: 'system',
  setColorScheme: (colorScheme) => {
    set({ colorScheme });
    AsyncStorage.setItem('@pitch_theme', colorScheme).catch(() => {});
  },
}));

// Rehydrate from storage on startup
AsyncStorage.getItem('@pitch_theme')
  .then((val) => {
    if (val === 'light' || val === 'dark' || val === 'system') {
      useThemeStore.setState({ colorScheme: val });
    }
  })
  .catch(() => {});
