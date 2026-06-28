/**
 * Supabase auth defaults to localStorage, which does not exist in a service
 * worker and is not shared across extension surfaces. This adapter persists the
 * session in chrome.storage.local so the side panel, popup and background SW all
 * observe the same auth state.
 */
export const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key)
    return (result[key] as string | undefined) ?? null
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key)
  },
}
