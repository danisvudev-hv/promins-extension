/** Hosts where the content script runs and injection is supported. */
export const CHAT_HOST_PATTERNS = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'gemini.google.com',
] as const

export type ChatHost = (typeof CHAT_HOST_PATTERNS)[number]

/** Returns true if the given URL belongs to a supported chat site. */
export function isChatUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const { hostname } = new URL(url)
    return CHAT_HOST_PATTERNS.some((h) => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/** chrome.storage.local keys. */
export const STORAGE_KEYS = {
  authSession: 'promins.auth.session',
  theme: 'promins.ui.theme',
  variableValues: 'promins.variables.lastUsed',
  queryCache: 'promins.query.cache',
} as const

/** Runtime message channel constants. */
export const MESSAGE_TARGET = 'PROMINS' as const
