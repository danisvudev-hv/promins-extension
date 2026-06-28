import type { SiteAdapter } from './types'
import { chatgptAdapter } from './chatgpt'
import { claudeAdapter } from './claude'
import { geminiAdapter } from './gemini'

const adapters: SiteAdapter[] = [chatgptAdapter, claudeAdapter, geminiAdapter]

export function resolveAdapter(host: string = location.hostname): SiteAdapter | null {
  return adapters.find((a) => a.matches(host)) ?? null
}
