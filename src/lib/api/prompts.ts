import { supabase } from '@/lib/supabase/client'
import { variableNames } from '@/lib/variables/parse'
import type { Prompt, PromptWithTags, Tag } from '@/lib/db/types'

export interface PromptFilters {
  search?: string
  categoryId?: string | null
  tagId?: string | null
  favoritesOnly?: boolean
  includeArchived?: boolean
}

interface PromptRowWithTags extends Prompt {
  prompt_tags: { tags: Tag }[] | null
}

function mapTags(row: PromptRowWithTags): PromptWithTags {
  const { prompt_tags, ...prompt } = row
  return { ...prompt, tags: (prompt_tags ?? []).map((pt) => pt.tags).filter(Boolean) }
}

export async function listPrompts(filters: PromptFilters = {}): Promise<PromptWithTags[]> {
  let query = supabase
    .from('prompts')
    .select('*, prompt_tags(tags(*))')
    .order('updated_at', { ascending: false })

  if (!filters.includeArchived) query = query.eq('is_archived', false)
  if (filters.favoritesOnly) query = query.eq('is_favorite', true)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.search?.trim()) {
    // Full-text search over the generated tsvector column.
    query = query.textSearch('search_tsv', filters.search.trim(), {
      type: 'websearch',
      config: 'english',
    })
  }

  const { data, error } = await query
  if (error) throw error
  let rows = (data as PromptRowWithTags[]).map(mapTags)
  // Tag filter is applied client-side because it filters on the m2m join.
  if (filters.tagId) rows = rows.filter((p) => p.tags.some((t) => t.id === filters.tagId))
  return rows
}

export async function getPrompt(id: string): Promise<PromptWithTags | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*, prompt_tags(tags(*))')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapTags(data as PromptRowWithTags) : null
}

export interface PromptInput {
  title: string
  body: string
  categoryId?: string | null
  tagIds?: string[]
  isFavorite?: boolean
}

export async function createPrompt(userId: string, input: PromptInput): Promise<Prompt> {
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: userId,
      title: input.title,
      body: input.body,
      category_id: input.categoryId ?? null,
      variables: variableNames(input.body),
      is_favorite: input.isFavorite ?? false,
    })
    .select('*')
    .single()
  if (error) throw error
  await replaceTags(data.id, input.tagIds ?? [])
  return data
}

export async function updatePrompt(id: string, input: PromptInput): Promise<Prompt> {
  const { data, error } = await supabase
    .from('prompts')
    .update({
      title: input.title,
      body: input.body,
      category_id: input.categoryId ?? null,
      variables: variableNames(input.body),
      is_favorite: input.isFavorite,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  await replaceTags(id, input.tagIds ?? [])
  return data
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase.from('prompts').update({ is_favorite: isFavorite }).eq('id', id)
  if (error) throw error
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) throw error
}

/** Replace the full tag set for a prompt (delete-all then insert). */
async function replaceTags(promptId: string, tagIds: string[]): Promise<void> {
  const { error: delErr } = await supabase.from('prompt_tags').delete().eq('prompt_id', promptId)
  if (delErr) throw delErr
  if (tagIds.length === 0) return
  const { error: insErr } = await supabase
    .from('prompt_tags')
    .insert(tagIds.map((tagId) => ({ prompt_id: promptId, tag_id: tagId })))
  if (insErr) throw insErr
}
