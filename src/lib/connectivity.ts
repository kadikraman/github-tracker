import { useSyncExternalStore } from 'react';

let offline = false;
const listeners = new Set<() => void>();

/** RN fetch throws TypeError('Network request failed'); GitHubApiError means the server was reached. */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.message.includes('Network request failed'))
  );
}

export function setOffline(next: boolean): void {
  if (next === offline) {
    return;
  }
  offline = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, () => offline);
}
