import { useMemo, useRef, useState } from 'react'
import { useAuth } from '@/lib/store/useAuth'
import { useTheme } from '@/lib/theme/theme'
import { useUiStore } from '@/lib/store/useUiStore'
import { hasVariables } from '@/lib/variables/parse'
import { sendToActiveChatTab } from '@/lib/messaging'
import { restoreVersion } from '@/lib/api/versions'
import { buildExport, importJson } from '@/lib/importExport/json'
import type { PromptVersion, PromptWithTags } from '@/lib/db/types'
import {
  useCategories,
  useCategoryMutations,
  usePromptMutations,
  usePrompts,
  useTags,
  useTagMutations,
} from './hooks'
import { Login } from './components/Login'
import { Filters } from './components/Filters'
import { PromptCard } from './components/PromptCard'
import { PromptEditor } from './components/PromptEditor'
import { VariableFillDialog } from './components/VariableFillDialog'
import { VersionHistory } from './components/VersionHistory'
import { Toaster } from './components/Toaster'
import { useToasts } from './components/toast'

type PendingAction = { kind: 'copy' | 'inject'; prompt: PromptWithTags } | null

export function App() {
  const { user, loading, signIn, signOut } = useAuth()
  const { mode, setMode } = useTheme()
  const push = useToasts((s) => s.push)

  const { search, categoryId, tagId, favoritesOnly } = useUiStore()
  const filters = useMemo(
    () => ({ search, categoryId, tagId, favoritesOnly }),
    [search, categoryId, tagId, favoritesOnly],
  )

  const userId = user?.id ?? ''
  const prompts = usePrompts(filters)
  const categories = useCategories()
  const tags = useTags()
  const promptMut = usePromptMutations(userId)
  const createCategory = useCategoryMutations(userId)
  const createTag = useTagMutations(userId)

  const [editing, setEditing] = useState<PromptWithTags | null | 'new'>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [history, setHistory] = useState<PromptWithTags | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading…</div>
  }
  if (!user) return <><Login onSignIn={signIn} /><Toaster /></>

  // Copy/inject either run directly or go through the variable dialog first.
  const startAction = (kind: 'copy' | 'inject', prompt: PromptWithTags) => {
    if (hasVariables(prompt.body)) {
      setPending({ kind, prompt })
    } else {
      void runAction(kind, prompt.body)
    }
  }

  const runAction = async (kind: 'copy' | 'inject', text: string) => {
    if (kind === 'copy') {
      await navigator.clipboard.writeText(text)
      push('Copied to clipboard')
      return
    }
    const result = await sendToActiveChatTab({ target: 'PROMINS', type: 'INJECT', text })
    if (result.ok) push(`Inserted into ${result.adapter ?? 'chat'}`)
    else push(result.error ?? 'Injection failed', 'error')
  }

  const handleRestore = async (prompt: PromptWithTags, version: PromptVersion) => {
    await restoreVersion(prompt.id, version, {
      categoryId: prompt.category_id,
      tagIds: prompt.tags.map((t) => t.id),
    })
    await prompts.refetch()
    push(`Restored v${version.version}`)
    setHistory(null)
  }

  const handleExport = async () => {
    const data = await buildExport()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promins-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    try {
      const json = JSON.parse(await file.text())
      const res = await importJson(userId, json)
      await prompts.refetch()
      push(`Imported ${res.imported}, skipped ${res.skipped}`)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Import failed', 'error')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            P
          </div>
          <span className="text-sm font-semibold">Promins</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => setEditing('new')} className="rounded-md bg-brand-600 px-2.5 py-1 font-medium text-white hover:bg-brand-700">
            + New
          </button>
          <button onClick={handleExport} title="Export" className="rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            ⤓
          </button>
          <button onClick={() => fileInput.current?.click()} title="Import" className="rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            ⤒
          </button>
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            className="rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mode === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={() => void signOut()} title="Sign out" className="rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            ⏻
          </button>
        </div>
      </header>

      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleImportFile(f)
          e.target.value = ''
        }}
      />

      <Filters categories={categories.data ?? []} tags={tags.data ?? []} />

      <main className="flex-1 overflow-y-auto p-3">
        {prompts.isLoading && <p className="text-sm text-slate-500">Loading prompts…</p>}
        {prompts.isError && <p className="text-sm text-red-500">Failed to load prompts.</p>}
        {prompts.data?.length === 0 && (
          <div className="mt-10 text-center text-sm text-slate-500">
            No prompts yet. Click <strong>+ New</strong> to create one.
          </div>
        )}
        <div className="flex flex-col gap-2">
          {prompts.data?.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onCopy={() => startAction('copy', p)}
              onInject={() => startAction('inject', p)}
              onEdit={() => setEditing(p)}
              onDelete={() => {
                if (confirm(`Delete "${p.title}"?`))
                  promptMut.remove.mutate(p.id, { onSuccess: () => push('Deleted') })
              }}
              onToggleFavorite={() => promptMut.favorite.mutate({ id: p.id, value: !p.is_favorite })}
              onHistory={() => setHistory(p)}
            />
          ))}
        </div>
      </main>

      {editing !== null && (
        <PromptEditor
          prompt={editing === 'new' ? null : editing}
          categories={categories.data ?? []}
          tags={tags.data ?? []}
          onCreateTag={(name) => createTag.mutateAsync(name)}
          onCreateCategory={(name) => createCategory.mutateAsync(name)}
          onSave={async (input) => {
            if (editing === 'new') await promptMut.create.mutateAsync(input)
            else await promptMut.update.mutateAsync({ id: editing.id, input })
            push('Saved')
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {pending && (
        <VariableFillDialog
          promptId={pending.prompt.id}
          title={pending.prompt.title}
          body={pending.prompt.body}
          onResolve={(rendered) => {
            void runAction(pending.kind, rendered)
            setPending(null)
          }}
          onClose={() => setPending(null)}
        />
      )}

      {history && (
        <VersionHistory
          promptId={history.id}
          title={history.title}
          onRestore={(v) => handleRestore(history, v)}
          onClose={() => setHistory(null)}
        />
      )}

      <Toaster />
    </div>
  )
}
