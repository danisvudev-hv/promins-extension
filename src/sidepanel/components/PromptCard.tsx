import type { PromptWithTags } from '@/lib/db/types'

interface Props {
  prompt: PromptWithTags
  onCopy: () => void
  onInject: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onHistory: () => void
}

export function PromptCard({
  prompt,
  onCopy,
  onInject,
  onEdit,
  onDelete,
  onToggleFavorite,
  onHistory,
}: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{prompt.title}</h3>
        <button
          onClick={onToggleFavorite}
          title="Toggle favorite"
          className={prompt.is_favorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'}
        >
          ★
        </button>
      </div>
      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-500 dark:text-slate-400">
        {prompt.body}
      </p>

      {(prompt.tags.length > 0 || prompt.variables.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {prompt.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              #{t.name}
            </span>
          ))}
          {prompt.variables.length > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {prompt.variables.length} var{prompt.variables.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={onCopy}
          className="rounded-md bg-brand-600 px-2.5 py-1 font-medium text-white hover:bg-brand-700"
        >
          Copy
        </button>
        <button
          onClick={onInject}
          className="rounded-md bg-slate-100 px-2.5 py-1 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Inject
        </button>
        <button
          onClick={onEdit}
          className="rounded-md px-2.5 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Edit
        </button>
        <button
          onClick={onHistory}
          className="rounded-md px-2.5 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          v{prompt.current_version}
        </button>
        <button
          onClick={onDelete}
          className="ml-auto rounded-md px-2.5 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
