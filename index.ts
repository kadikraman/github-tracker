import '@legendapp/spark/runtime-entry';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

import App from './App';
import { POPOVER_COMPONENT, startMenuBar } from './src/lib/menuBar';
import { MenuBarApp } from './src/screens/MenuBarApp';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// Spark's host window renders 'main'.
registerRootComponent(App);

// Second surface: rendered inside the menu bar popover window (see menuBar.ts).
AppRegistry.registerComponent(POPOVER_COMPONENT, () => MenuBarApp);
startMenuBar();
