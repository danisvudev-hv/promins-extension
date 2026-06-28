import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { parseVariables } from '@/lib/variables/parse'
import { renderTemplate } from '@/lib/variables/render'
import { STORAGE_KEYS } from '@/shared/constants'

interface Props {
  promptId: string
  title: string
  body: string
  /** What to do with the rendered text. */
  onResolve: (rendered: string) => void
  onClose: () => void
}

type Stored = Record<string, Record<string, string>>

/**
 * Collects values for {{variables}} before copy/inject, remembering the last
 * used values per prompt. If the prompt has no variables the dialog is skipped
 * by the caller, so this always renders ≥1 field.
 */
export function VariableFillDialog({ promptId, title, body, onResolve, onClose }: Props) {
  const variables = parseVariables(body)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, v.defaultValue ?? ''])),
  )

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.variableValues).then((r) => {
      const stored = (r[STORAGE_KEYS.variableValues] as Stored | undefined)?.[promptId]
      if (stored) setValues((prev) => ({ ...prev, ...stored }))
    })
  }, [promptId])

  const submit = async () => {
    const existing =
      ((await chrome.storage.local.get(STORAGE_KEYS.variableValues))[
        STORAGE_KEYS.variableValues
      ] as Stored | undefined) ?? {}
    existing[promptId] = values
    await chrome.storage.local.set({ [STORAGE_KEYS.variableValues]: existing })
    onResolve(renderTemplate(body, values))
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
          <Dialog.Title className="text-sm font-semibold">Fill in variables</Dialog.Title>
          <Dialog.Description className="mb-3 text-xs text-slate-500">
            {title}
          </Dialog.Description>
          <div className="flex flex-col gap-3">
            {variables.map((v) => (
              <label key={v.name} className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">{v.name}</span>
                <input
                  autoFocus={variables[0]?.name === v.name}
                  value={values[v.name] ?? ''}
                  placeholder={v.defaultValue ?? `Enter ${v.name}`}
                  onChange={(e) => setValues((s) => ({ ...s, [v.name]: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
