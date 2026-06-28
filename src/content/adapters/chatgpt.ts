import { insertIntoEditable, queryFirst, type SiteAdapter } from './types'

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',
  matches: (host) => host === 'chatgpt.com' || host === 'chat.openai.com',
  findInput: () =>
    queryFirst([
      '#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[data-id]',
      'textarea',
    ]),
  setText: insertIntoEditable,
  submit: () => {
    const btn = document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]')
    btn?.click()
  },
}
