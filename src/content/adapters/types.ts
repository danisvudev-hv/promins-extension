export interface SiteAdapter {
  /** Unique id used in logging / message results. */
  id: string
  /** Whether this adapter handles the given hostname. */
  matches(host: string): boolean
  /** Locate the chat input element, trying multiple selectors. */
  findInput(): HTMLElement | null
  /** Insert text into the editable element using site-appropriate events. */
  setText(el: HTMLElement, text: string): Promise<void>
  /** Optionally submit the chat form (only when the caller requests it). */
  submit?(el: HTMLElement): void
}

/**
 * Robust insertion for contenteditable editors (ProseMirror / Quill). Naive
 * textContent assignment is ignored by these editors, so we focus and use
 * execCommand('insertText') which dispatches the InputEvents the editor expects,
 * falling back to a manual InputEvent dispatch.
 */
export async function insertIntoEditable(el: HTMLElement, text: string): Promise<void> {
  el.focus()

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }

  // Clear existing content first.
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(el)
  selection?.removeAllRanges()
  selection?.addRange(range)

  const inserted = document.execCommand('insertText', false, text)
  if (!inserted) {
    // Fallback for editors that block execCommand.
    el.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: text, bubbles: true, cancelable: true }),
    )
    el.textContent = text
    el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true }))
  }
}

/** Query a list of selectors in order, returning the first visible match. */
export function queryFirst(selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel)
    if (el && el.offsetParent !== null) return el
  }
  // Second pass without visibility check (covers focus-only editors).
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel)
    if (el) return el
  }
  return null
}
