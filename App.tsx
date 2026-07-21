import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { HiddenProvider } from './src/hooks/useHidden';
import { TokenProvider, useToken } from './src/hooks/useToken';
import { setupFocusManager } from './src/lib/focusManager';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';

const queryClient = new QueryClient();

function Root() {
  const { token } = useToken();
  const [screen, setScreen] = useState<'tracker' | 'settings'>('tracker');

  if (!token) {
    return <SettingsScreen />;
  }
  if (screen === 'settings') {
    return <SettingsScreen onDone={() => setScreen('tracker')} />;
  }
  return <TrackerScreen onOpenSettings={() => setScreen('settings')} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
  });

  useEffect(() => setupFocusManager(), []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TokenProvider>
        <HiddenProvider>
          <Root />
        </HiddenProvider>
      </TokenProvider>
    </QueryClientProvider>
  );
}
