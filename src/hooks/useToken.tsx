import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { queryClient } from '../lib/queryClient';
import { clearItemsCache } from '../storage/itemsCache';
import { peekToken, saveToken, subscribeToken } from '../storage/tokenStore';

type TokenContextValue = {
  token: string | null;
  /** False until the token has been read from secure storage. */
  loaded: boolean;
  setToken: (token: string | null) => void;
};

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeToken, peekToken);

  const setToken = useCallback((next: string | null) => {
    saveToken(next).catch((error: unknown) => console.error('Saving the token failed', error));
    // Clear the file before the queries so remounts can't re-seed from it.
    clearItemsCache();
    queryClient.removeQueries({ queryKey: ['items'] });
  }, []);

  const value = useMemo(
    () => ({ token: token ?? null, loaded: token !== undefined, setToken }),
    [token, setToken]
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useToken(): TokenContextValue {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}
