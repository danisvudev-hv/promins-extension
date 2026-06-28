import { insertIntoEditable, queryFirst, type SiteAdapter } from './types'

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',
  matches: (host) => host === 'gemini.google.com',
  findInput: () =>
    queryFirst([
      'rich-textarea div.ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
    ]),
  setText: insertIntoEditable,
  submit: () => {
    const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Send message"], button.send-button')
    btn?.click()
  },
}
