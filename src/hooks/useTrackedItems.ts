import { useQuery } from '@tanstack/react-query';
import { SECTION_QUERIES, searchItems, type SectionKey } from '../api/github';
import { useToken } from './useToken';

export function useTrackedItems(key: SectionKey) {
  const { token } = useToken();
  return useQuery({
    queryKey: ['items', key],
    queryFn: () => searchItems(token as string, SECTION_QUERIES[key]),
    enabled: token != null,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: 1,
  });
}
