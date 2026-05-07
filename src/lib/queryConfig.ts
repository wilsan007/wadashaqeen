import { QueryClient } from '@tanstack/react-query';

export const CACHE_TTL = {
  static: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },
  semiStatic: { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 },
  realtime: { staleTime: 30 * 1000, gcTime: 2 * 60 * 1000 },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TTL.semiStatic.staleTime,
      gcTime: CACHE_TTL.semiStatic.gcTime,
      retry: (failureCount, error: any) => {
        if (error?.status === 403 || error?.status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
