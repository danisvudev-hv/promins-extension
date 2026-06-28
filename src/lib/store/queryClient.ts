import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { STORAGE_KEYS } from '@/shared/constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // keep cache 24h for offline-first reads
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Offline-first: hydrate the cache from chrome.storage.local and write through.
const persister = createAsyncStoragePersister({
  key: STORAGE_KEYS.queryCache,
  storage: {
    getItem: async (key) => (await chrome.storage.local.get(key))[key] ?? null,
    setItem: async (key, value) => chrome.storage.local.set({ [key]: value }),
    removeItem: async (key) => chrome.storage.local.remove(key),
  },
})

export function enablePersistence(): void {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24,
  })
}
