-- Row Level Security: every user can only access their own rows.

alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.tags            enable row level security;
alter table public.prompts         enable row level security;
alter table public.prompt_tags     enable row level security;
alter table public.prompt_versions enable row level security;

-- profiles: gated by id = auth.uid()
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- categories / tags / prompts / prompt_versions: gated by user_id = auth.uid()
drop policy if exists own_categories on public.categories;
create policy own_categories on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_tags on public.tags;
create policy own_tags on public.tags
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_prompts on public.prompts;
create policy own_prompts on public.prompts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_prompt_versions on public.prompt_versions;
create policy own_prompt_versions on public.prompt_versions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- prompt_tags has no user_id: gate via the parent prompt's ownership.
drop policy if exists own_prompt_tags on public.prompt_tags;
create policy own_prompt_tags on public.prompt_tags
  for all
  using (exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid()));
