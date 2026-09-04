-- Phase 2B verification. Prerequisite: migrations 001-018 and both demo seed scripts.
-- Execute as migration/owner role; all mutations roll back.
begin;
set local app.demo_seed_enabled='on';
set local app.demo_reset_enabled='on';

create procedure pg_temp.expect_domain(p_expected text,p_statement text)
language plpgsql as $$
declare v_detail text;
begin
  begin
    execute p_statement;
  exception when sqlstate 'P0001' then
    get stacked diagnostics v_detail=pg_exception_detail;
    if position('AGRINEXIS_CODE='||p_expected||';' in coalesce(v_detail,''))>0 then return; end if;
    raise exception 'expected domain %, got %',p_expected,v_detail using errcode='XX000';
  end;
  raise exception 'expected domain %, statement succeeded',p_expected using errcode='XX000';
end $$;

-- A same-buyer recommendation from another listing is unrelated.
call internal.reset_sih_demo();
insert into public.produce_listings(id,farmer_profile_id,crop_id,variety_id,quantity,available_quantity,available_from,district,state,status)
values ('40000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',1000,1000,current_date,'Pune','Maharashtra','ACTIVE');
insert into public.recommendations(id,farmer_profile_id,listing_id,candidate_buyer_profile_id,demand_id,logistics_quote_id,
  estimated_quantity_kg,estimated_unit_price_per_kg,estimated_gross_selling_value,estimated_transportation_cost,estimated_storage_cost,
  estimated_handling_cost,estimated_other_applicable_cost,estimated_total_applicable_cost,estimated_net_farmer_realization,currency,rank,
  data_mode,source_name,engine_version,calculated_at,expires_at)
values ('43000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000099',
  '20000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002',
  1000,31,31000,1500,300,300,150,2250,28750,'INR',1,'DEMO','TEST','test',now(),now()+interval '1 hour');
call pg_temp.expect_domain('RECOMMENDATION_INVALID',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000099','unrelated-rec','a',31000,2250,28750,'INR')$q$);

-- Buyer A recommendation cannot accompany Buyer B offer.
call internal.reset_sih_demo();
call pg_temp.expect_domain('RECOMMENDATION_INVALID',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000001','bad-rec','a',31000,2250,28750,'INR')$q$);

-- Expired recommendation is distinct from unrelated recommendation.
call internal.reset_sih_demo();
update public.recommendations set calculated_at=now()-interval '2 days',expires_at=now()-interval '1 day'
where id='43000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('RECOMMENDATION_EXPIRED',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','expired-rec','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
update public.buyer_demands set status='CANCELLED' where id='41000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('DEMAND_INVALID',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002',null,'invalid-demand','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
update public.buyer_demands set delivery_from=current_date-2,delivery_until=current_date-1 where id='41000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('DEMAND_EXPIRED',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002',null,'expired-demand','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
update public.buyer_demands set buyer_profile_id='20000000-0000-4000-8000-000000000002' where id='41000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('DEMAND_INVALID',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002',null,'owner-demand','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
insert into public.crops(id,canonical_code,name_en) values ('30000000-0000-4000-8000-000000000099','TEST_OTHER','Other');
update public.buyer_demands set crop_id='30000000-0000-4000-8000-000000000099',variety_id=null where id='41000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('DEMAND_INVALID',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002',null,'crop-demand','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
update public.buyer_demands set fulfilled_quantity=500,status='PARTIALLY_FILLED' where id='41000000-0000-4000-8000-000000000002';
call pg_temp.expect_domain('DEMAND_QUANTITY_EXCEEDED',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002',null,'quantity-demand','a',31000,2250,28750,'INR')$q$);

call internal.reset_sih_demo();
call pg_temp.expect_domain('CURRENCY_MISMATCH',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','currency','a',31000,2250,28750,'USD')$q$);

-- Partial acceptance leaves remaining inventory ACTIVE and demand partially filled.
call internal.reset_sih_demo();
update public.offers set offered_quantity=400 where id='41500000-0000-4000-8000-000000000002';
update public.recommendations set estimated_quantity_kg=400,estimated_gross_selling_value=12400,
  estimated_net_farmer_realization=10150 where id='43000000-0000-4000-8000-000000000002';
select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','partial','a',12400,2250,10150,'INR');
do $$ begin
  if not exists(select 1 from public.produce_listings where id='40000000-0000-4000-8000-000000000001' and available_quantity=600 and status='ACTIVE') then
    raise exception 'partial listing was not left ACTIVE'; end if;
end $$;

-- Full acceptance sells the listing. Same request replays; changed fingerprint conflicts.
call internal.reset_sih_demo();
create temporary table accepted_result(id uuid) on commit drop;
insert into accepted_result select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','full','same',31000,2250,28750,'INR');
do $$ declare replay uuid; begin
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
    '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','full','same',31000,2250,28750,'INR') into replay;
  if replay is distinct from (select id from accepted_result) then raise exception 'same idempotent request did not replay'; end if;
  if not exists(select 1 from public.produce_listings where id='40000000-0000-4000-8000-000000000001' and available_quantity=0 and status='SOLD') then
    raise exception 'fully consumed listing was not SOLD'; end if;
end $$;
call pg_temp.expect_domain('IDEMPOTENCY_CONFLICT',$q$
  select internal.accept_offer('20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
  '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','full','different',31000,2250,28750,'INR')$q$);

-- Payment transitions are validated and audited by the trusted function.
insert into public.payments(id,order_id,amount,currency,mode,status)
select '60000000-0000-4000-8000-000000000001',id,28750,'INR','DEMO','PENDING' from accepted_result;
select (internal.transition_payment(null,'60000000-0000-4000-8000-000000000001','PENDING','PROCESSING','test')).status;
call pg_temp.expect_domain('PAYMENT_TRANSITION_INVALID',$q$
  select internal.transition_payment(null,'60000000-0000-4000-8000-000000000001','PROCESSING','REFUNDED','invalid test')$q$);

-- Reset removes only deterministic demo transactions and restores rolling validity/economics.
call internal.reset_sih_demo();
do $$ begin
  if exists(select 1 from public.orders where accepted_offer_id in ('41500000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002')) then raise exception 'demo order survived reset'; end if;
  if not exists(select 1 from public.offers where id='41500000-0000-4000-8000-000000000002' and status='PENDING' and expires_at>now()) then raise exception 'offer not acceptance-ready'; end if;
  if not exists(select 1 from public.recommendations where id='43000000-0000-4000-8000-000000000001' and estimated_net_farmer_realization=25500) then raise exception 'Buyer A economics changed'; end if;
  if not exists(select 1 from public.recommendations where id='43000000-0000-4000-8000-000000000002' and estimated_net_farmer_realization=28750 and rank=1) then raise exception 'Buyer B economics/rank changed'; end if;
end $$;

rollback;
