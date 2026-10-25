create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  birth_year integer not null check (birth_year between 1900 and 2200),
  sex text not null check (sex in ('female', 'male', 'other', 'prefer_not')),
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 30 and 300),
  pregnant boolean not null default false,
  breastfeeding boolean not null default false,
  diet text[] not null default '{}',
  allergies text[] not null default '{}',
  reference_source text not null,
  reference_version text not null,
  onboarded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pregnancy_reference_group check (sex = 'female' or (not pregnant and not breastfeeding))
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null check (char_length(raw_text) between 1 and 2000),
  eaten_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 160),
  amount_g numeric(8,2) not null check (amount_g between 0.1 and 10000),
  portion_label text not null default '',
  quantity_confidence text not null check (quantity_confidence in ('high', 'medium', 'low')),
  match_confidence text not null check (match_confidence in ('high', 'medium', 'low')),
  fdc_id bigint not null check (fdc_id > 0),
  fdc_description text not null,
  data_type text not null,
  nutrients_per_100g jsonb not null check (jsonb_typeof(nutrients_per_100g) = 'object'),
  nutrients_for_amount jsonb not null check (jsonb_typeof(nutrients_for_amount) = 'object'),
  missing_nutrients text[] not null default '{}',
  source_url text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_eaten_at_idx on public.meals (user_id, eaten_at desc);
create index meal_items_meal_id_idx on public.meal_items (meal_id);
create index meal_items_user_id_idx on public.meal_items (user_id);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create policy meals_select_own on public.meals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy meals_insert_own on public.meals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy meals_update_own on public.meals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meals_delete_own on public.meals for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy meal_items_select_own on public.meal_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy meal_items_insert_own on public.meal_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy meal_items_update_own on public.meal_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meal_items_delete_own on public.meal_items for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.meals, public.meal_items from anon;
grant select, insert, update, delete on public.profiles, public.meals, public.meal_items to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger meals_set_updated_at before update on public.meals
for each row execute function private.set_updated_at();
create trigger meal_items_set_updated_at before update on public.meal_items
for each row execute function private.set_updated_at();

create or replace function public.save_meal(
  p_meal_id uuid,
  p_raw_text text,
  p_eaten_at timestamptz,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_meal_id uuid;
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_raw_text is null or char_length(p_raw_text) not between 1 and 2000 then
    raise exception 'raw_text must contain 1 to 2000 characters' using errcode = '22023';
  end if;
  if p_eaten_at is null then
    raise exception 'eaten_at is required' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'items must contain 1 to 30 entries' using errcode = '22023';
  end if;

  if p_meal_id is null then
    insert into public.meals (user_id, raw_text, eaten_at)
    values (v_user_id, p_raw_text, p_eaten_at)
    returning id into v_meal_id;
  else
    update public.meals
      set raw_text = p_raw_text, eaten_at = p_eaten_at
      where id = p_meal_id and user_id = v_user_id
      returning id into v_meal_id;
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'meal not found' using errcode = 'P0002';
    end if;
    delete from public.meal_items where meal_id = v_meal_id and user_id = v_user_id;
  end if;

  insert into public.meal_items (
    meal_id, user_id, display_name, amount_g, portion_label,
    quantity_confidence, match_confidence, fdc_id, fdc_description, data_type,
    nutrients_per_100g, nutrients_for_amount, missing_nutrients, source_url, notes
  )
  select
    v_meal_id,
    v_user_id,
    item->>'display_name',
    (item->>'amount_g')::numeric,
    coalesce(item->>'portion_label', ''),
    item->>'quantity_confidence',
    item->>'match_confidence',
    (item->>'fdc_id')::bigint,
    item->>'fdc_description',
    item->>'data_type',
    item->'nutrients_per_100g',
    (
      select coalesce(
        jsonb_object_agg(
          nutrient.key,
          to_jsonb(round((nutrient.value #>> '{}')::numeric * (item->>'amount_g')::numeric / 100, 2))
        ),
        '{}'::jsonb
      )
      from jsonb_each(item->'nutrients_per_100g') as nutrient
    ),
    array(
      select nutrient_key
      from unnest(array['protein','fiber','calcium','iron','potassium','vitaminC','vitaminB12','folate']) as keys(nutrient_key)
      where not (item->'nutrients_per_100g' ? nutrient_key)
    ),
    'https://fdc.nal.usda.gov/fdc-app.html#/food-details/' || (item->>'fdc_id') || '/nutrients',
    item->>'notes'
  from jsonb_array_elements(p_items) as item;

  return v_meal_id;
end;
$$;

revoke all on function public.save_meal(uuid, text, timestamptz, jsonb) from public, anon;
grant execute on function public.save_meal(uuid, text, timestamptz, jsonb) to authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
