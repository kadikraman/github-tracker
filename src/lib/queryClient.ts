import { QueryClient } from '@tanstack/react-query';
import type { SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';
import { setCachedSection } from '../storage/itemsCache';
import { isNetworkError, setOffline } from './connectivity';

// Shared by the main window and the menu bar popover (both React trees run
// in the same JS runtime), so fetched data and invalidations are shared.
export const queryClient = new QueryClient();

// Module scope: must register exactly once per JS runtime.
queryClient.getQueryCache().subscribe((event) => {
  if (event.type !== 'updated') {
    return;
  }
  if (event.action.type === 'success') {
    const { queryKey, state } = event.query;
    if (queryKey[0] === 'items' && state.data !== undefined) {
      setCachedSection(queryKey[1] as SectionKey, state.data as TrackedItem[], state.dataUpdatedAt);
    }
    setOffline(false);
  } else if (event.action.type === 'error') {
    setOffline(isNetworkError(event.action.error));
  }
});
// onlineManager is left always-online on purpose: polling while offline is what detects recovery.
