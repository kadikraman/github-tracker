import { useQuery } from '@tanstack/react-query';
import { SECTION_QUERIES, searchItems, type SectionKey } from '../api/github';
import { getCachedSection } from '../storage/itemsCache';
import { useToken } from './useToken';

export function useTrackedItems(key: SectionKey) {
  const { token } = useToken();
  return useQuery({
    queryKey: ['items', key],
    queryFn: () => searchItems(token as string, SECTION_QUERIES[key]),
    enabled: token != null,
    initialData: () => getCachedSection(key)?.items,
    initialDataUpdatedAt: () => getCachedSection(key)?.updatedAt,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: 1,
  });
}
