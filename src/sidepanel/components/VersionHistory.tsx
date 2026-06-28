import * as Dialog from '@radix-ui/react-dialog'
import { useVersions } from '../hooks'
import type { PromptVersion } from '@/lib/db/types'

interface Props {
  promptId: string
  title: string
  onRestore: (version: PromptVersion) => Promise<void>
  onClose: () => void
}

export function VersionHistory({ promptId, title, onRestore, onClose }: Props) {
  const { data: versions, isLoading } = useVersions(promptId)

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Dialog.Title className="text-sm font-semibold">Version history</Dialog.Title>
            <Dialog.Description className="text-xs text-slate-500">{title}</Dialog.Description>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {isLoading && <p className="p-2 text-sm text-slate-500">Loading…</p>}
            {!isLoading && (versions?.length ?? 0) === 0 && (
              <p className="p-2 text-sm text-slate-500">
                No previous versions yet. Edits to the title or body create versions.
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {versions?.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">v{v.version}</span>
                    <button
                      onClick={() => onRestore(v)}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      Restore
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-medium">{v.title}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-500">
                    {v.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
