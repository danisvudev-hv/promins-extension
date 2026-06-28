import { resolveAdapter } from './adapters/registry'
import { isContentMessage, type MessageResult } from '@/lib/messaging/types'

/** Retry finding the input for a short window to handle late-mounting DOM. */
async function findInputWithRetry(
  adapter: ReturnType<typeof resolveAdapter>,
  attempts = 10,
  delayMs = 150,
): Promise<HTMLElement | null> {
  for (let i = 0; i < attempts; i++) {
    const el = adapter?.findInput() ?? null
    if (el) return el
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isContentMessage(message)) return

  const adapter = resolveAdapter()
  if (!adapter) {
    sendResponse({ ok: false, error: 'This site is not supported for injection.' } satisfies MessageResult)
    return
  }

  if (message.type === 'PING') {
    sendResponse({ ok: true, adapter: adapter.id } satisfies MessageResult)
    return
  }

  if (message.type === 'INJECT') {
    void (async () => {
      const el = await findInputWithRetry(adapter)
      if (!el) {
        sendResponse({
          ok: false,
          adapter: adapter.id,
          error: 'Could not find the chat input. The site layout may have changed.',
        } satisfies MessageResult)
        return
      }
      try {
        await adapter.setText(el, message.text)
        if (message.submit) adapter.submit?.(el)
        sendResponse({ ok: true, adapter: adapter.id } satisfies MessageResult)
      } catch (err) {
        sendResponse({
          ok: false,
          adapter: adapter.id,
          error: err instanceof Error ? err.message : 'Injection failed.',
        } satisfies MessageResult)
      }
    })()
    // Keep the message channel open for the async response.
    return true
  }
})
