-- Promins schema: profiles, categories, tags, prompts, prompt_tags, prompt_versions.
-- All app tables live in public; auth.users is Supabase-managed.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name, parent_id)
);
create index if not exists categories_user_idx on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------------------------------------------------------------------------
-- prompts
-- ---------------------------------------------------------------------------
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  body text not null,
  variables text[] not null default '{}',
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  current_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);
create index if not exists prompts_user_idx on public.prompts (user_id);
create index if not exists prompts_user_fav_idx on public.prompts (user_id, is_favorite);
create index if not exists prompts_search_idx on public.prompts using gin (search_tsv);

-- ---------------------------------------------------------------------------
-- prompt_tags (m2m)
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_tags (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- prompt_versions (snapshot history)
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (prompt_id, version)
);
create index if not exists prompt_versions_idx on public.prompt_versions (prompt_id, version desc);
