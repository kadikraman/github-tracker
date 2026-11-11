import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../theme';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

export function ThemeSegmentedControl() {
  const { mode, setMode, colors } = useTheme();
  const options: { value: ThemeMode; icon: (color: string) => ReactNode }[] = [
    { value: 'light', icon: (color) => <SunIcon size={15} color={color} /> },
    { value: 'dark', icon: (color) => <MoonIcon size={15} color={color} /> },
    { value: 'system', icon: (color) => <MonitorIcon size={15} color={color} /> },
  ];
  return (
    <View style={[styles.container, { backgroundColor: colors.sunken }]}>
      {options.map((option) => {
        const active = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[styles.button, active && [{ backgroundColor: colors.card }, colors.shadow]]}
          >
            {option.icon(active ? colors.text : colors.faint)}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 2,
    borderRadius: 9,
  },
  button: {
    width: 30,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
