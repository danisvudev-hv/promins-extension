import { insertIntoEditable, queryFirst, type SiteAdapter } from './types'

export const claudeAdapter: SiteAdapter = {
  id: 'claude',
  matches: (host) => host === 'claude.ai' || host.endsWith('.claude.ai'),
  findInput: () =>
    queryFirst([
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ]),
  setText: insertIntoEditable,
  submit: () => {
    const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Send message"], button[aria-label="Send Message"]')
    btn?.click()
  },
}
