import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/types'
import { chromeStorageAdapter } from './storageAdapter'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surfaced early during dev so a missing .env is obvious.
  console.warn('[Promins] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.')
}

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    // No URL-based session detection inside an extension context.
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
})
