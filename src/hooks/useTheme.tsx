import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { loadSettings, updateSettings } from '../storage/settings';
import { darkPalette, lightPalette, type Palette, type ResolvedTheme, type ThemeMode } from '../theme';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: ResolvedTheme;
  colors: Palette;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => loadSettings().themeMode ?? 'system');

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    updateSettings({ themeMode: next });
  }, []);

  // Sync the native window chrome (title bar) with the in-app theme choice;
  // null restores following the system appearance.
  useEffect(() => {
    Appearance.setColorScheme(mode === 'system' ? null : mode);
  }, [mode]);

  const resolved: ResolvedTheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const colors = resolved === 'dark' ? darkPalette : lightPalette;

  const value = useMemo(
    () => ({ mode, setMode, resolved, colors }),
    [mode, setMode, resolved, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
