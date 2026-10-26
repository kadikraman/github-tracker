import { deleteItemAsync, getItemAsync, setItemAsync } from '@legendapp/spark/secure-storage';

const KEY = 'github-token';

// Secure storage is async, but both React roots share this JS runtime: the
// first load is cached here so a root that mounts later renders at once.
let cached: string | null | undefined;
const loading = getItemAsync(KEY)
  .catch(() => null)
  .then((token) => {
    if (cached === undefined) {
      cached = token;
    }
    return cached;
  });

/** The token, or undefined while the first secure-storage read is pending. */
export function peekToken(): string | null | undefined {
  return cached;
}

export function loadToken(): Promise<string | null> {
  return loading;
}

export async function saveToken(token: string | null): Promise<void> {
  cached = token;
  if (token == null) {
    await deleteItemAsync(KEY);
  } else {
    await setItemAsync(KEY, token);
  }
}
