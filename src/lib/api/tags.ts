import { supabase } from '@/lib/supabase/client'
import type { Tag } from '@/lib/db/types'

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createTag(userId: string, name: string, color?: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: userId, name, color: color ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}

/** Upsert a tag by name for a user; returns the existing or newly created row. */
export async function ensureTag(userId: string, name: string): Promise<Tag> {
  const trimmed = name.trim()
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('name', trimmed)
    .maybeSingle()
  if (existing) return existing
  return createTag(userId, trimmed)
}
