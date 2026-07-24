import { requireNativeModule } from 'expo-modules-core';

type MenuBarNativeModule = {
  openMainWindow(): void;
  closePopover(): void;
};

export default requireNativeModule<MenuBarNativeModule>('MenuBar');
