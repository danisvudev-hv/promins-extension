/**
 * Database types. Hand-authored to mirror supabase/migrations and kept in sync
 * via `npm run gen:types` (supabase gen types typescript --linked).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          settings?: Json
        }
        Update: {
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          settings?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          parent_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
        }
        Update: {
          name?: string
          color?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          title: string
          body: string
          variables: string[]
          is_favorite: boolean
          is_archived: boolean
          current_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          title: string
          body: string
          variables?: string[]
          is_favorite?: boolean
          is_archived?: boolean
        }
        Update: {
          category_id?: string | null
          title?: string
          body?: string
          variables?: string[]
          is_favorite?: boolean
          is_archived?: boolean
        }
        Relationships: []
      }
      prompt_tags: {
        Row: { prompt_id: string; tag_id: string }
        Insert: { prompt_id: string; tag_id: string }
        Update: { prompt_id?: string; tag_id?: string }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          version: number
          title: string
          body: string
          created_at: string
        }
        Insert: {
          prompt_id: string
          user_id: string
          version: number
          title: string
          body: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row aliases.
type Tables = Database['public']['Tables']
export type Profile = Tables['profiles']['Row']
export type Category = Tables['categories']['Row']
export type Tag = Tables['tags']['Row']
export type Prompt = Tables['prompts']['Row']
export type PromptVersion = Tables['prompt_versions']['Row']

/** A prompt joined with its tags, as returned by the list query. */
export interface PromptWithTags extends Prompt {
  tags: Tag[]
}
