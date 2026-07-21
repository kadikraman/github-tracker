import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadSettings, updateSettings } from '../storage/settings';

type HiddenMap = Record<string, number[]>;

type HiddenContextValue = {
  hidden: HiddenMap;
  hideItem: (sectionKey: string, id: number) => void;
  unhideItem: (sectionKey: string, id: number) => void;
};

const HiddenContext = createContext<HiddenContextValue | undefined>(undefined);

export function HiddenProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<HiddenMap>(() => loadSettings().hidden ?? {});

  const update = useCallback((mutate: (prev: HiddenMap) => HiddenMap) => {
    setHidden((prev) => {
      const next = mutate(prev);
      updateSettings({ hidden: next });
      return next;
    });
  }, []);

  const hideItem = useCallback(
    (sectionKey: string, id: number) => {
      update((prev) => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey] ?? []).filter((x) => x !== id), id],
      }));
    },
    [update]
  );

  const unhideItem = useCallback(
    (sectionKey: string, id: number) => {
      update((prev) => ({
        ...prev,
        [sectionKey]: (prev[sectionKey] ?? []).filter((x) => x !== id),
      }));
    },
    [update]
  );

  const value = useMemo(() => ({ hidden, hideItem, unhideItem }), [hidden, hideItem, unhideItem]);

  return <HiddenContext.Provider value={value}>{children}</HiddenContext.Provider>;
}

export function useHidden(): HiddenContextValue {
  const context = useContext(HiddenContext);
  if (!context) {
    throw new Error('useHidden must be used within a HiddenProvider');
  }
  return context;
}
