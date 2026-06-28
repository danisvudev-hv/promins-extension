-- Triggers: new-user profile creation and prompt version snapshots.

-- ---------------------------------------------------------------------------
-- Create a profiles row whenever a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Snapshot the previous title/body into prompt_versions on every meaningful
-- update, and bump current_version atomically. Runs BEFORE UPDATE so the
-- increment can't race across concurrent edits.
-- ---------------------------------------------------------------------------
create or replace function public.snapshot_prompt_version()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'UPDATE'
      and (old.title is distinct from new.title or old.body is distinct from new.body)) then
    insert into public.prompt_versions (prompt_id, user_id, version, title, body)
    values (old.id, old.user_id, old.current_version, old.title, old.body);
    new.current_version := old.current_version + 1;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_prompt_version on public.prompts;
create trigger trg_prompt_version
  before update on public.prompts
  for each row execute function public.snapshot_prompt_version();
