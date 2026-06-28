import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { createPrompt } from '@/lib/api/prompts'
import { ensureTag } from '@/lib/api/tags'
import { createCategory, listCategories } from '@/lib/api/categories'

const exportPromptSchema = z.object({
  title: z.string().min(1),
  body: z.string(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
})

const exportFileSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  prompts: z.array(exportPromptSchema),
})

export type ExportFile = z.infer<typeof exportFileSchema>

/** Build a portable JSON export of the user's prompts (with tag/category names). */
export async function buildExport(): Promise<ExportFile> {
  const { data, error } = await supabase
    .from('prompts')
    .select('title, body, is_favorite, categories(name), prompt_tags(tags(name))')
  if (error) throw error

  const prompts = (data ?? []).map((row) => {
    const r = row as unknown as {
      title: string
      body: string
      is_favorite: boolean
      categories: { name: string } | null
      prompt_tags: { tags: { name: string } }[] | null
    }
    return {
      title: r.title,
      body: r.body,
      is_favorite: r.is_favorite,
      category: r.categories?.name ?? null,
      tags: (r.prompt_tags ?? []).map((pt) => pt.tags.name),
    }
  })

  return {
    version: 1,
    // Caller stamps the real timestamp; kept deterministic-friendly here.
    exported_at: new Date().toISOString(),
    prompts,
  }
}

export interface ImportResult {
  imported: number
  skipped: number
}

/** Validate and import a previously exported JSON file for the given user. */
export async function importJson(userId: string, raw: unknown): Promise<ImportResult> {
  const parsed = exportFileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid Promins export file: ' + parsed.error.issues[0]?.message)
  }

  const existingCategories = await listCategories()
  const categoryByName = new Map(existingCategories.map((c) => [c.name, c.id]))

  let imported = 0
  let skipped = 0
  for (const p of parsed.data.prompts) {
    try {
      let categoryId: string | null = null
      if (p.category) {
        categoryId = categoryByName.get(p.category) ?? null
        if (!categoryId) {
          const created = await createCategory(userId, p.category)
          categoryByName.set(p.category, created.id)
          categoryId = created.id
        }
      }
      const tagIds: string[] = []
      for (const name of p.tags ?? []) {
        const tag = await ensureTag(userId, name)
        tagIds.push(tag.id)
      }
      await createPrompt(userId, {
        title: p.title,
        body: p.body,
        categoryId,
        tagIds,
        isFavorite: p.is_favorite,
      })
      imported++
    } catch {
      skipped++
    }
  }
  return { imported, skipped }
}
