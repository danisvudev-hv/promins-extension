import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/store/useAuth'
import { listPrompts } from '@/lib/api/prompts'
import { sendToActiveChatTab } from '@/lib/messaging'
import { renderTemplate } from '@/lib/variables/render'
import { hasVariables } from '@/lib/variables/parse'
import type { PromptWithTags } from '@/lib/db/types'

/** Open the side panel via the background SW (needs the user-gesture relay). */
function openSidePanel() {
  chrome.runtime.sendMessage({ target: 'PROMINS_BG', type: 'OPEN_SIDE_PANEL' })
  window.close()
}

export function Popup() {
  const { user, loading, signIn } = useAuth()
  const [prompts, setPrompts] = useState<PromptWithTags[]>([])
  const [search, setSearch] = useState('')
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (user) listPrompts({ favoritesOnly: true }).then(setPrompts).catch(() => setPrompts([]))
  }, [user])

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading…</div>

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="text-sm font-semibold">Promins</span>
        <button
          onClick={() => signIn().catch(() => setNote('Sign-in failed'))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        >
          Continue with Google
        </button>
        {note && <p className="text-xs text-red-500">{note}</p>}
      </div>
    )
  }

  const filtered = prompts.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true,
  )

  const act = async (p: PromptWithTags, kind: 'copy' | 'inject') => {
    // Popup has no room for the variable dialog; copy/inject the raw body with
    // empty defaults applied. Use the side panel for variable-filled prompts.
    const text = hasVariables(p.body) ? renderTemplate(p.body, {}) : p.body
    if (kind === 'copy') {
      await navigator.clipboard.writeText(text)
      setNote('Copied')
    } else {
      const r = await sendToActiveChatTab({ target: 'PROMINS', type: 'INJECT', text })
      setNote(r.ok ? 'Inserted' : r.error ?? 'Failed')
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-2 dark:border-slate-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search favorites…"
          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button onClick={openSidePanel} className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white">
          Open panel
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="p-2 text-center text-xs text-slate-500">
            No favorites. Star prompts in the side panel for quick access.
          </p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="truncate text-sm">{p.title}</span>
            <div className="flex shrink-0 gap-1 text-xs">
              <button onClick={() => act(p, 'copy')} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                Copy
              </button>
              <button onClick={() => act(p, 'inject')} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                Inject
              </button>
            </div>
          </div>
        ))}
      </div>
      {note && <p className="border-t border-slate-200 p-2 text-center text-xs text-slate-500 dark:border-slate-800">{note}</p>}
    </div>
  )
}
