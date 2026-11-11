import { useEffect, useState } from 'react';
import type { SectionKey } from '../api/github';
import { timeAgo } from '../lib/timeAgo';
import { useTrackedItems } from './useTrackedItems';

/** Every section's query, plus the sync state the toolbars show. */
export function useAllSections() {
  const queries: Record<SectionKey, ReturnType<typeof useTrackedItems>> = {
    review: useTrackedItems('review'),
    authored: useTrackedItems('authored'),
    reviewed: useTrackedItems('reviewed'),
    mentioned: useTrackedItems('mentioned'),
    issues: useTrackedItems('issues'),
  };
  const all = Object.values(queries);
  const anyFetching = all.some((q) => q.isFetching);
  const lastUpdatedAt = Math.max(0, ...all.map((q) => q.dataUpdatedAt));

  // The "Updated 3m ago" label ages without any query changing.
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const syncLabel = anyFetching
    ? 'Syncing…'
    : lastUpdatedAt > 0
      ? `Updated ${timeAgo(new Date(lastUpdatedAt).toISOString())}`
      : 'Waiting for first sync';

  return { queries, anyFetching, lastUpdatedAt, syncLabel };
}
