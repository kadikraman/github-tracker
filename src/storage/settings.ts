import { File, Paths } from 'expo-file-system';

export type Settings = {
  token?: string;
  hidden?: Record<string, number[]>;
  themeMode?: 'light' | 'dark' | 'system';
};

const settingsFile = new File(Paths.document, 'settings.json');

export function loadSettings(): Settings {
  try {
    if (!settingsFile.exists) {
      return {};
    }
    return JSON.parse(settingsFile.textSync()) as Settings;
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  settingsFile.write(JSON.stringify(settings));
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}
