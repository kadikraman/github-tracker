import { useQuery } from '@tanstack/react-query';
import { fetchViewer } from '../api/github';
import { useToken } from './useToken';

/** The signed-in user. The login shortens repository names that the user owns. */
export function useViewer() {
  const { token } = useToken();
  return useQuery({
    queryKey: ['viewer'],
    queryFn: () => fetchViewer(token as string),
    enabled: token != null,
    staleTime: Infinity,
  });
}
