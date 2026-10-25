create table public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  raw_text text not null check (char_length(raw_text) between 1 and 2000),
  items jsonb not null check (
    jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 30
  ),
  usage_count integer not null default 0 check (usage_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index meal_templates_user_updated_at_idx
  on public.meal_templates (user_id, updated_at desc);

alter table public.meal_templates enable row level security;

create policy meal_templates_select_own on public.meal_templates
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy meal_templates_insert_own on public.meal_templates
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy meal_templates_update_own on public.meal_templates
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy meal_templates_delete_own on public.meal_templates
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.meal_templates from anon;
grant select, insert, update, delete on public.meal_templates to authenticated;

create trigger meal_templates_set_updated_at
  before update on public.meal_templates
  for each row execute function private.set_updated_at();
