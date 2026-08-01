import { File, Paths } from 'expo-file-system';
import type { SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';

export type CachedSection = {
  items: TrackedItem[];
  updatedAt: number;
};

type ItemsCache = {
  version: 1;
  sections: Partial<Record<SectionKey, CachedSection>>;
};

const CACHE_VERSION = 1;

const cacheFile = new File(Paths.document, 'items-cache.json');

function emptyCache(): ItemsCache {
  return { version: CACHE_VERSION, sections: {} };
}

function loadCache(): ItemsCache {
  try {
    if (!cacheFile.exists) {
      return emptyCache();
    }
    const parsed = JSON.parse(cacheFile.textSync()) as ItemsCache;
    if (parsed.version !== CACHE_VERSION || parsed.sections == null) {
      return emptyCache();
    }
    return parsed;
  } catch {
    return emptyCache();
  }
}

let cache = loadCache();

export function getCachedSection(key: SectionKey): CachedSection | undefined {
  return cache.sections[key];
}

export function setCachedSection(key: SectionKey, items: TrackedItem[], updatedAt: number): void {
  cache.sections[key] = { items, updatedAt };
  try {
    cacheFile.write(JSON.stringify(cache));
  } catch {
    // Runs in a query-cache subscriber; must not throw.
  }
}

export function clearItemsCache(): void {
  cache = emptyCache();
  try {
    if (cacheFile.exists) {
      cacheFile.delete();
    }
  } catch {
    // Stale file is discarded on next load anyway.
  }
}
