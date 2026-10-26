import { deleteItemAsync, getItemAsync, setItemAsync } from '@legendapp/spark/secure-storage';

const KEY = 'github-token';

// Secure storage is async, but both React roots share this JS runtime: the
// first load is cached here so a root that mounts later renders at once.
let cached: string | null | undefined;
// The popover root stays mounted while hidden, so each root listens for a
// token saved in the other.
const listeners = new Set<() => void>();

function setCached(token: string | null): void {
  cached = token;
  listeners.forEach((listener) => listener());
}

getItemAsync(KEY)
  .catch(() => null)
  .then((token) => {
    if (cached === undefined) {
      setCached(token);
    }
  });

/** The token, or undefined while the first secure-storage read is pending. */
export function peekToken(): string | null | undefined {
  return cached;
}

export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function saveToken(token: string | null): Promise<void> {
  setCached(token);
  if (token == null) {
    await deleteItemAsync(KEY);
  } else {
    await setItemAsync(KEY, token);
  }
}
