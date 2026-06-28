import { useState } from 'react'
import { useToasts } from './toast'

export function Login({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const push = useToasts((s) => s.push)

  const handle = async () => {
    setBusy(true)
    try {
      await onSignIn()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Sign-in failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
        P
      </div>
      <div>
        <h1 className="text-xl font-semibold">Promins</h1>
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Manage your prompts & instructions with categories, tags and version history — synced to
          your account.
        </p>
      </div>
      <button
        onClick={handle}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {busy ? 'Signing in…' : 'Continue with Google'}
      </button>
    </div>
  )
}
