import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { HiddenProvider } from './src/hooks/useHidden';
import { ThemeProvider } from './src/hooks/useTheme';
import { TokenProvider, useToken } from './src/hooks/useToken';
import { setupFocusManager } from './src/lib/focusManager';
import { queryClient } from './src/lib/queryClient';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';

function Root() {
  const { token, loaded } = useToken();
  const [screen, setScreen] = useState<'tracker' | 'settings'>('tracker');

  if (!loaded) {
    return null;
  }
  if (!token) {
    return <SettingsScreen />;
  }
  if (screen === 'settings') {
    return <SettingsScreen onDone={() => setScreen('tracker')} />;
  }
  return <TrackerScreen onOpenSettings={() => setScreen('settings')} />;
}

export default function App() {
  useEffect(() => setupFocusManager(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TokenProvider>
          <HiddenProvider>
            <Root />
          </HiddenProvider>
        </TokenProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
