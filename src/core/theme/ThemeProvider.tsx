import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme } from './theme';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemePrefState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Persisted user preference for theme mode. */
export const useThemePref = create<ThemePrefState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'duet-theme', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const mode = useThemePref((s) => s.mode);

  const theme = useMemo<Theme>(() => {
    const resolved = mode === 'system' ? (system ?? 'dark') : mode;
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [mode, system]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Primary styling hook used across the component library. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
