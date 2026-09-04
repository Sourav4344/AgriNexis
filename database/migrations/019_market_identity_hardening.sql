-- Phase 3A market identity and read-path hardening.
-- Rollback:
--   drop index if exists public.price_history_mandi_crop_date_idx;
--   drop index if exists public.mandis_state_district_idx;
--   drop index if exists public.mandis_provider_identity_uidx;

do $$
begin
  if exists (
    select 1
    from public.mandis
    where provider_name is not null and external_id is not null
    group by provider_name, external_id
    having count(*) > 1
  ) then
    raise exception 'duplicate non-null mandi provider identities must be resolved before migration 019';
  end if;
end $$;

create unique index mandis_provider_identity_uidx
  on public.mandis(provider_name, external_id)
  where provider_name is not null and external_id is not null;

create index mandis_state_district_idx
  on public.mandis(state, district);

create index price_history_mandi_crop_date_idx
  on public.price_history(mandi_id, crop_id, price_date desc);

