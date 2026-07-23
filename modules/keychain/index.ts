import { requireNativeModule } from 'expo-modules-core';

type KeychainNativeModule = {
  get(service: string, account: string): string | null;
  set(service: string, account: string, value: string): void;
  remove(service: string, account: string): void;
};

export default requireNativeModule<KeychainNativeModule>('Keychain');
