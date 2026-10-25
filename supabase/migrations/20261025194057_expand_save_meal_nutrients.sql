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
          to_jsonb(round((nutrient.value #>> '{}')::numeric * (item->>'amount_g')::numeric / 100, 4))
        ),
        '{}'::jsonb
      )
      from jsonb_each(item->'nutrients_per_100g') as nutrient
    ),
    array(
      select nutrient_key
      from unnest(array[
        'protein','fiber','water','alphaLinolenicAcid','epaDha','dha','linoleicAcid',
        'biotin','vitaminB12','folate','niacin','pantothenicAcid','riboflavin','thiamin',
        'vitaminA','vitaminB6','vitaminC','vitaminD','vitaminE','vitaminK',
        'calcium','chloride','copper','fluoride','iodine','iron','magnesium','manganese',
        'molybdenum','phosphorus','potassium','selenium','sodium','zinc'
      ]) as keys(nutrient_key)
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
