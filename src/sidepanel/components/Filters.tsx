import type { Category, Tag } from '@/lib/db/types'
import { useUiStore } from '@/lib/store/useUiStore'

export function Filters({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const { search, categoryId, tagId, favoritesOnly, setSearch, setCategory, setTag, toggleFavoritesOnly } =
    useUiStore()

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          onClick={toggleFavoritesOnly}
          title="Favorites only"
          className={`rounded-md border px-3 text-sm ${
            favoritesOnly
              ? 'border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30'
              : 'border-slate-300 text-slate-400 dark:border-slate-700'
          }`}
        >
          ★
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategory(e.target.value || null)}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={tagId ?? ''}
          onChange={(e) => setTag(e.target.value || null)}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
