import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPrompt,
  deletePrompt,
  listPrompts,
  toggleFavorite,
  updatePrompt,
  type PromptFilters,
  type PromptInput,
} from '@/lib/api/prompts'
import { createCategory, listCategories } from '@/lib/api/categories'
import { createTag, listTags } from '@/lib/api/tags'
import { listVersions } from '@/lib/api/versions'

const keys = {
  prompts: (f: PromptFilters) => ['prompts', f] as const,
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  versions: (id: string) => ['versions', id] as const,
}

export function usePrompts(filters: PromptFilters) {
  return useQuery({ queryKey: keys.prompts(filters), queryFn: () => listPrompts(filters) })
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: listCategories })
}

export function useTags() {
  return useQuery({ queryKey: keys.tags, queryFn: listTags })
}

export function useVersions(promptId: string | null) {
  return useQuery({
    queryKey: keys.versions(promptId ?? ''),
    queryFn: () => listVersions(promptId!),
    enabled: !!promptId,
  })
}

export function usePromptMutations(userId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['prompts'] })

  const create = useMutation({
    mutationFn: (input: PromptInput) => createPrompt(userId, input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PromptInput }) => updatePrompt(id, input),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['versions'] })
    },
  })
  const remove = useMutation({ mutationFn: (id: string) => deletePrompt(id), onSuccess: invalidate })
  const favorite = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => toggleFavorite(id, value),
    onSuccess: invalidate,
  })
  return { create, update, remove, favorite }
}

export function useCategoryMutations(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createCategory(userId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  })
}

export function useTagMutations(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTag(userId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tags }),
  })
}
