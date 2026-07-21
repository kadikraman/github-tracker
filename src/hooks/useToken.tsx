import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadSettings, saveSettings } from '../storage/settings';

type TokenContextValue = {
  token: string | null;
  setToken: (token: string | null) => void;
};

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => loadSettings().token ?? null);

  const setToken = useCallback((next: string | null) => {
    setTokenState(next);
    const settings = loadSettings();
    saveSettings({ ...settings, token: next ?? undefined });
  }, []);

  const value = useMemo(() => ({ token, setToken }), [token, setToken]);

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useToken(): TokenContextValue {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}
