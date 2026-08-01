import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { queryClient } from '../lib/queryClient';
import { clearItemsCache } from '../storage/itemsCache';
import { loadToken, saveToken } from '../storage/tokenStore';

type TokenContextValue = {
  token: string | null;
  setToken: (token: string | null) => void;
};

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => loadToken());

  const setToken = useCallback((next: string | null) => {
    setTokenState(next);
    saveToken(next);
    // Clear the file before the queries so remounts can't re-seed from it.
    clearItemsCache();
    queryClient.removeQueries({ queryKey: ['items'] });
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
