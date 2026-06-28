/**
 * Typed message contracts between the side panel/popup and content scripts.
 * Every message carries a `target` discriminator so unrelated runtime messages
 * are ignored.
 */
import { MESSAGE_TARGET } from '@/shared/constants'

export interface InjectMessage {
  target: typeof MESSAGE_TARGET
  type: 'INJECT'
  text: string
  /** When true, attempt to submit the chat form after inserting. Default false. */
  submit?: boolean
}

export interface PingMessage {
  target: typeof MESSAGE_TARGET
  type: 'PING'
}

export type ContentMessage = InjectMessage | PingMessage

export interface MessageResult {
  ok: boolean
  error?: string
  /** Which adapter handled the message (for debugging). */
  adapter?: string
}

export function isContentMessage(value: unknown): value is ContentMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { target?: unknown }).target === MESSAGE_TARGET
  )
}
