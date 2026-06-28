import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/shared/constants'
import type { ThemeMode } from '@/lib/store/useUiStore'

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyTheme(mode: ThemeMode): void {
  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

/** Reads/writes the theme to chrome.storage.local and applies the `dark` class. */
export function useTheme(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const [mode, setModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.theme).then((r) => {
      const stored = (r[STORAGE_KEYS.theme] as ThemeMode | undefined) ?? 'system'
      setModeState(stored)
      applyTheme(stored)
    })
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    applyTheme(next)
    void chrome.storage.local.set({ [STORAGE_KEYS.theme]: next })
  }

  return { mode, setMode }
}
