import Keychain from '../../modules/keychain';
import { loadSettings, updateSettings } from './settings';

const SERVICE = 'dev.kadi.github-tracker';
const ACCOUNT = 'github-token';

export function loadToken(): string | null {
  // One-time migration: earlier versions kept the token in plaintext
  // settings.json. Move it into the Keychain and scrub the file.
  const legacy = loadSettings().token;
  if (legacy) {
    Keychain.set(SERVICE, ACCOUNT, legacy);
    updateSettings({ token: undefined });
    return legacy;
  }
  return Keychain.get(SERVICE, ACCOUNT);
}

export function saveToken(token: string | null): void {
  if (token == null) {
    Keychain.remove(SERVICE, ACCOUNT);
  } else {
    Keychain.set(SERVICE, ACCOUNT, token);
  }
}
