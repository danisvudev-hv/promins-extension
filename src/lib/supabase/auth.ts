import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** SHA-256 hash of the nonce (Google hashes the nonce inside the id_token). */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function parseFragment(redirectUrl: string): URLSearchParams {
  const hash = new URL(redirectUrl).hash.replace(/^#/, '')
  return new URLSearchParams(hash)
}

/**
 * Sign in with Google using chrome.identity.launchWebAuthFlow to obtain an
 * OpenID id_token, then bridge it into Supabase via signInWithIdToken.
 * Must be called in response to a user gesture.
 */
export async function signInWithGoogle(): Promise<Session> {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
  if (!clientId) throw new Error('VITE_GOOGLE_OAUTH_CLIENT_ID is not configured.')

  const redirectUri = chrome.identity.getRedirectURL()
  const rawNonce = randomNonce()
  const hashedNonce = await sha256(rawNonce)

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'id_token')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('nonce', hashedNonce)
  authUrl.searchParams.set('prompt', 'select_account')

  const redirectResult = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  })
  if (!redirectResult) throw new Error('Sign-in was cancelled.')

  const params = parseFragment(redirectResult)
  const idToken = params.get('id_token')
  if (!idToken) {
    const error = params.get('error') ?? 'No id_token returned from Google.'
    throw new Error(error)
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    // The raw nonce; Supabase/Google compares its hash against the id_token claim.
    nonce: rawNonce,
  })
  if (error) throw error
  if (!data.session) throw new Error('Supabase did not return a session.')
  return data.session
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}
