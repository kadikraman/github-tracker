import { useSyncExternalStore } from 'react';
import Updater from '../../modules/updater';
import type { UpdateStatus } from '../../modules/updater';

let status: UpdateStatus = { phase: 'idle' };
const listeners = new Set<() => void>();

function setStatus(next: UpdateStatus): void {
  status = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUpdateStatus(): UpdateStatus {
  return useSyncExternalStore(subscribe, () => status);
}

export function getCurrentVersion(): { version: string; build: string } {
  return Updater.getCurrentVersion();
}

export async function checkForUpdates(): Promise<void> {
  try {
    await Updater.checkForUpdates();
  } catch (error) {
    setStatus({ phase: 'error', message: errorMessage(error) });
  }
}

export async function installAndRelaunch(): Promise<void> {
  try {
    await Updater.installAndRelaunch();
  } catch (error) {
    setStatus({ phase: 'error', message: errorMessage(error) });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Module scope runs once in the shared JS runtime, so both React roots see
// the same update state. Sparkle checks on its own schedule after start().
status = Updater.getState();
Updater.addListener('onUpdateStatus', setStatus);
Updater.start().catch((error: unknown) => {
  setStatus({ phase: 'error', message: errorMessage(error) });
});
