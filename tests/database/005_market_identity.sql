-- Phase 3A verification. Prerequisite: migrations 001-019 and demo seed 001.
-- Execute as a migration/owner role able to SET ROLE authenticated.
begin;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and indexname='mandis_provider_identity_uidx'
      and indexdef like '%UNIQUE INDEX%provider_name, external_id%WHERE%provider_name IS NOT NULL%external_id IS NOT NULL%'
  ) then raise exception 'partial mandi provider identity index is missing'; end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='mandis_state_district_idx') then
    raise exception 'mandi geography index is missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='price_history_mandi_crop_date_idx') then
    raise exception 'mandi history index is missing';
  end if;
end $$;

-- The deterministic demo mandi remains represented by its original UUID/identity.
do $$ begin
  if not exists (
    select 1 from public.mandis
    where id='32000000-0000-4000-8000-000000000001'
      and provider_name='AGRINEXIS_DEMO' and external_id='PUNE_DEMO'
  ) then raise exception 'deterministic demo mandi identity changed or is missing'; end if;
end $$;

-- Duplicate non-null composite identity is rejected.
do $$ begin
  begin
    insert into public.mandis(provider_name,external_id,name,state)
    values ('AGRINEXIS_DEMO','PUNE_DEMO','Duplicate','Maharashtra');
    raise exception 'duplicate provider identity was accepted';
  exception when unique_violation then null; end;
end $$;

-- The same external ID is valid under a different provider.
insert into public.mandis(id,provider_name,external_id,name,state)
values ('32000000-0000-4000-8000-000000000091','OTHER_PROVIDER','PUNE_DEMO','Other Provider Mandi','Maharashtra');

-- Manual/local mandis may omit either or both identity components.
insert into public.mandis(id,provider_name,external_id,name,state) values
('32000000-0000-4000-8000-000000000092',null,null,'Manual Mandi One','Maharashtra'),
('32000000-0000-4000-8000-000000000093',null,null,'Manual Mandi Two','Maharashtra'),
('32000000-0000-4000-8000-000000000094','LOCAL',null,'Local Mandi One','Maharashtra'),
('32000000-0000-4000-8000-000000000095','LOCAL',null,'Local Mandi Two','Maharashtra');

-- Existing observation identity/deduplication remains unchanged.
do $$ begin
  begin
    insert into public.mandi_prices(
      mandi_id,crop_id,variety_id,min_price,modal_price,max_price,observed_at,fetched_at,
      source_name,source_id,data_mode
    ) values (
      '32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001',28,30,33,
      '2026-09-01 09:00:00+05:30','2026-09-01 09:05:00+05:30',
      'AGRINEXIS_DEMO','PRICE-1','DEMO'
    );
    raise exception 'duplicate market observation was accepted';
  exception when unique_violation then null; end;
end $$;

-- Market observations and derived history remain append-only.
do $$ begin
  begin
    update public.mandi_prices set modal_price=31 where id='33000000-0000-4000-8000-000000000001';
    raise exception 'market observation update was accepted';
  exception when sqlstate '55000' then null; end;
  begin
    delete from public.price_history where id='34000000-0000-4000-8000-000000000001';
    raise exception 'price history delete was accepted';
  exception when sqlstate '55000' then null; end;
end $$;

-- Ordinary authenticated users cannot insert fake observations.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ begin
  begin
    insert into public.mandi_prices(mandi_id,crop_id,min_price,modal_price,max_price,observed_at,source_name,data_mode)
    values ('32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,1,1,now(),'UNTRUSTED','LIVE');
    raise exception 'authenticated user inserted a market observation';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- A trusted migration/backend database role can still ingest a new immutable row.
insert into public.mandi_prices(
  mandi_id,crop_id,variety_id,min_price,modal_price,max_price,normalized_unit,currency,
  arrival_quantity,observed_at,source_name,source_id,data_mode
) values (
  '32000000-0000-4000-8000-000000000091','30000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',30,31,32,'kg','INR',1000,
  '2026-09-03 09:00:00+05:30','TRUSTED_TEST','OBS-1','LIVE'
);

rollback;
