import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

interface UiState {
  search: string
  categoryId: string | null
  tagId: string | null
  favoritesOnly: boolean
  setSearch: (v: string) => void
  setCategory: (id: string | null) => void
  setTag: (id: string | null) => void
  toggleFavoritesOnly: () => void
  resetFilters: () => void
}

export const useUiStore = create<UiState>((set) => ({
  search: '',
  categoryId: null,
  tagId: null,
  favoritesOnly: false,
  setSearch: (search) => set({ search }),
  setCategory: (categoryId) => set({ categoryId }),
  setTag: (tagId) => set({ tagId }),
  toggleFavoritesOnly: () => set((s) => ({ favoritesOnly: !s.favoritesOnly })),
  resetFilters: () => set({ search: '', categoryId: null, tagId: null, favoritesOnly: false }),
}))
