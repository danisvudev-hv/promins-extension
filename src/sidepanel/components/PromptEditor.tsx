import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Category, PromptWithTags, Tag } from '@/lib/db/types'
import type { PromptInput } from '@/lib/api/prompts'
import { parseVariables } from '@/lib/variables/parse'

interface Props {
  prompt?: PromptWithTags | null
  categories: Category[]
  tags: Tag[]
  onCreateTag: (name: string) => Promise<Tag>
  onCreateCategory: (name: string) => Promise<Category>
  onSave: (input: PromptInput) => Promise<void>
  onClose: () => void
}

export function PromptEditor({
  prompt,
  categories,
  tags,
  onCreateTag,
  onCreateCategory,
  onSave,
  onClose,
}: Props) {
  const [title, setTitle] = useState(prompt?.title ?? '')
  const [body, setBody] = useState(prompt?.body ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(prompt?.category_id ?? null)
  const [tagIds, setTagIds] = useState<string[]>(prompt?.tags.map((t) => t.id) ?? [])
  const [newTag, setNewTag] = useState('')
  const [busy, setBusy] = useState(false)

  const detectedVars = parseVariables(body)

  const toggleTag = (id: string) =>
    setTagIds((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]))

  const addTag = async () => {
    const name = newTag.trim()
    if (!name) return
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    const tag = existing ?? (await onCreateTag(name))
    if (!tagIds.includes(tag.id)) setTagIds((ids) => [...ids, tag.id])
    setNewTag('')
  }

  const addCategory = async () => {
    const name = window.prompt('New category name')?.trim()
    if (!name) return
    const cat = await onCreateCategory(name)
    setCategoryId(cat.id)
  }

  const save = async () => {
    if (!title.trim() || !body.trim()) return
    setBusy(true)
    try {
      await onSave({ title: title.trim(), body, categoryId, tagIds })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[94vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Dialog.Title className="text-sm font-semibold">
              {prompt ? 'Edit prompt' : 'New prompt'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">Prompt editor form</Dialog.Description>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto p-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Prompt body — use {{variable}} for placeholders"
                rows={8}
                className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              {detectedVars.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Variables: {detectedVars.map((v) => `{{${v.name}}}`).join(', ')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addCategory}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700"
              >
                + Category
              </button>
            </div>

            <div>
              <div className="mb-1 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      tagIds.includes(t.id)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag and press Enter"
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy || !title.trim() || !body.trim()}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
