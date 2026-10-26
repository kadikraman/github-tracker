import { getAppContext } from '@legendapp/spark/app';
import {
  checkForUpdates as sparkCheckForUpdates,
  configureUpdates,
  getUpdateStatus,
  onUpdateEvent,
  type UpdateUnavailableReason,
} from '@legendapp/spark/updates';
import { useSyncExternalStore } from 'react';

export type UpdatePhase =
  | 'loading'
  | 'unavailable'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'upToDate'
  | 'error';

export type UpdateStatus = {
  phase: UpdatePhase;
  /** Installed app version, once known. */
  appVersion?: string;
  /** Version of the offered update, when known. */
  version?: string;
  /** Why updates cannot run in this build, only for `unavailable`. */
  reason?: UpdateUnavailableReason;
  /** Human-readable error message, only for `error`. */
  message?: string;
};

let status: UpdateStatus = { phase: 'loading' };
const listeners = new Set<() => void>();

function setStatus(patch: Partial<UpdateStatus>): void {
  status = { ...status, ...patch };
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

/** Starts an interactive check: Sparkle shows its own update windows. */
export async function checkForUpdates(): Promise<void> {
  try {
    await sparkCheckForUpdates({ mode: 'interactive' });
  } catch (error) {
    setStatus({ phase: 'error', message: errorMessage(error) });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Module scope runs once in the shared JS runtime, so both React roots see
// the same update state. Sparkle checks on its own schedule once configured.
onUpdateEvent((event) => {
  switch (event.state) {
    case 'checking':
      setStatus({ phase: 'checking', message: undefined });
      break;
    case 'notAvailable':
      setStatus({ phase: 'upToDate' });
      break;
    case 'cancelled':
    case 'skipped':
      setStatus({ phase: 'idle' });
      break;
    case 'error':
      setStatus({ phase: 'error', message: event.message });
      break;
    default:
      setStatus({ phase: event.state, version: event.version });
  }
});

getAppContext()
  .then((context) => setStatus({ appVersion: context.version }))
  .catch(() => {});

getUpdateStatus()
  .then(async (current) => {
    if (!current.available) {
      setStatus({ phase: 'unavailable', reason: current.reason });
      return;
    }
    // Sparkle's automatic checks start off; this app has always checked on
    // its own. configureUpdates also starts the updater.
    await configureUpdates({ automaticallyChecks: true });
    setStatus({ phase: 'idle' });
  })
  .catch((error: unknown) => setStatus({ phase: 'error', message: errorMessage(error) }));
