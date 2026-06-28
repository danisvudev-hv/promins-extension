import { useToasts } from './toast'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto w-full max-w-sm rounded-lg px-3 py-2 text-sm shadow-lg ${
            t.kind === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-900 text-white dark:bg-slate-700'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
