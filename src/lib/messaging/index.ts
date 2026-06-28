import { isChatUrl } from '@/shared/constants'
import type { ContentMessage, MessageResult } from './types'

/** Find the active tab in the current window. */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

/**
 * Send a message to the content script of the active chat tab. Falls back to
 * programmatically injecting the content script if it is not yet present
 * (e.g. the tab was loaded before the extension was installed/updated).
 */
export async function sendToActiveChatTab(message: ContentMessage): Promise<MessageResult> {
  const tab = await getActiveTab()
  if (!tab?.id || !isChatUrl(tab.url)) {
    return { ok: false, error: 'No supported chat tab is active (ChatGPT, Claude or Gemini).' }
  }

  try {
    return await chrome.tabs.sendMessage<ContentMessage, MessageResult>(tab.id, message)
  } catch {
    // Content script not present (e.g. the tab was open before install/update).
    // The static content_scripts registration injects on the next load, so the
    // honest recovery is to ask the user to reload the page.
    return {
      ok: false,
      error: 'Could not reach the page — please reload the chat tab and try again.',
    }
  }
}
