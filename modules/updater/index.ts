import { requireNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'installing'
  | 'upToDate'
  | 'error';

export type UpdateStatus = {
  phase: UpdatePhase;
  /** Version string of the update, when known. */
  version?: string;
  /** Download progress in [0, 1], only during `downloading`. */
  progress?: number;
  /** Human-readable error message, only for `error`. */
  message?: string;
};

type UpdaterNativeModule = {
  getCurrentVersion(): { version: string; build: string };
  getState(): UpdateStatus;
  /** Resolves false in Debug builds, where the updater stays off. */
  start(): Promise<boolean>;
  checkForUpdates(): Promise<void>;
  installAndRelaunch(): Promise<void>;
  addListener(
    eventName: 'onUpdateStatus',
    listener: (status: UpdateStatus) => void
  ): EventSubscription;
};

export default requireNativeModule<UpdaterNativeModule>('Updater');
