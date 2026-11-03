import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { isAbortError } from '@/lib/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isAbortError(error)) return false
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
