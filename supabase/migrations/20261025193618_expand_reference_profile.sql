alter table public.profiles
  add column life_stage text not null default 'none'
    check (life_stage in ('none', 'pregnant_t1', 'pregnant_t2', 'pregnant_t3', 'lactating_0_6', 'lactating_over_6')),
  add column menopause_status text not null default 'not_applicable'
    check (menopause_status in ('pre', 'post', 'not_applicable')),
  add column phytate_level text not null default 'medium'
    check (phytate_level in ('low', 'medium', 'high', 'very_high')),
  add column reference_profile_version smallint not null default 1
    check (reference_profile_version between 1 and 100);

alter table public.profiles
  add constraint life_stage_reference_group check (
    sex = 'female' or life_stage = 'none'
  ),
  add constraint menopause_reference_group check (
    sex = 'female' or menopause_status = 'not_applicable'
  ),
  add constraint legacy_life_stage_consistency check (
    pregnant = (life_stage in ('pregnant_t1', 'pregnant_t2', 'pregnant_t3'))
    and breastfeeding = (life_stage in ('lactating_0_6', 'lactating_over_6'))
  ) not valid;

comment on column public.profiles.sex is
  'Physiological female/male reference group used only to select official BLV intake values; legacy other/prefer_not values require profile completion.';
comment on column public.profiles.phytate_level is
  'Self-reported phytate intake category used only for the BLV zinc reference.';
comment on column public.profiles.reference_profile_version is
  'Profile questionnaire version. Version 2 requires weight and the complete adult BLV reference inputs.';
