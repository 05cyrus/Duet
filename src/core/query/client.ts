import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client. We lean on long staleness + Firestore listeners
 * (bridged via setQueryData) rather than refetch-on-focus polling — this is a
 * core cost lever: live data arrives through one open listener, not repeated
 * reads. So we disable aggressive refetching here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});
