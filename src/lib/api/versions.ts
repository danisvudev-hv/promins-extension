import { supabase } from '@/lib/supabase/client'
import type { PromptVersion } from '@/lib/db/types'
import { updatePrompt } from './prompts'

export async function listVersions(promptId: string): Promise<PromptVersion[]> {
  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Restore a previous version by writing its title/body back onto the prompt.
 * The BEFORE UPDATE trigger snapshots the current state, so restoring itself
 * produces a new version — preserving a clean audit trail. Tags/category are
 * left untouched (versions only track title/body).
 */
export async function restoreVersion(
  promptId: string,
  version: PromptVersion,
  keep: { categoryId?: string | null; tagIds?: string[] },
): Promise<void> {
  await updatePrompt(promptId, {
    title: version.title,
    body: version.body,
    categoryId: keep.categoryId ?? null,
    tagIds: keep.tagIds ?? [],
  })
}
