/**
 * Background service worker.
 * - Opens the side panel when the toolbar action is clicked.
 * - Keeps Supabase auto-refresh alive while the SW is awake (the session lives
 *   in chrome.storage.local, so it is rehydrated on each wake).
 */
import { supabase } from '@/lib/supabase/client'

// Open the side panel on action click. We keep a popup too, but allow the
// action click to also reveal the panel where the platform supports it.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((err) => console.warn('[Promins] setPanelBehavior failed', err))
})

// Allow other surfaces (popup) to request opening the side panel within a
// user gesture relayed through the background.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target === 'PROMINS_BG' && message.type === 'OPEN_SIDE_PANEL') {
    chrome.windows.getCurrent().then((win) => {
      if (win.id !== undefined) {
        chrome.sidePanel.open({ windowId: win.id }).then(
          () => sendResponse({ ok: true }),
          (err) => sendResponse({ ok: false, error: String(err) }),
        )
      }
    })
    return true
  }
  return undefined
})

// Touch the session on startup so autoRefreshToken resumes after the SW wakes.
chrome.runtime.onStartup.addListener(() => {
  void supabase.auth.getSession()
})
