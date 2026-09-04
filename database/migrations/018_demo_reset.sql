-- Guarded reset for the one deterministic SIH dataset.
-- Rollback: drop reset_sih_demo and restore prevent_mutation from migration 012.

create or replace function internal.prevent_mutation()
returns trigger language plpgsql set search_path = pg_catalog
as $$
begin
  if coalesce(current_setting('app.demo_seed_enabled',true),'off')='on'
     and coalesce(current_setting('app.demo_reset_enabled',true),'off')='on' then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  raise exception '% is append-only',tg_table_name using errcode='55000';
end $$;

create function internal.reset_sih_demo()
returns void
language plpgsql security definer
set search_path = pg_catalog, public, internal
as $$
declare
  v_order_ids uuid[];
begin
  if coalesce(current_setting('app.demo_seed_enabled',true),'off')<>'on'
     or coalesce(current_setting('app.demo_reset_enabled',true),'off')<>'on' then
    perform internal.raise_domain_error('DEMO_RESET_DISABLED',403);
  end if;

  select coalesce(array_agg(id),'{}'::uuid[]) into v_order_ids
  from public.orders
  where accepted_offer_id in (
    '41500000-0000-4000-8000-000000000001'::uuid,
    '41500000-0000-4000-8000-000000000002'::uuid
  );

  delete from public.grievance_messages where grievance_id in (select id from public.grievances where order_id=any(v_order_ids));
  delete from public.grievances where order_id=any(v_order_ids);
  delete from public.ratings where order_id=any(v_order_ids);
  delete from public.payments where order_id=any(v_order_ids);
  delete from public.order_financial_adjustments where order_id=any(v_order_ids);
  delete from public.order_status_history where order_id=any(v_order_ids);
  delete from internal.audit_events where resource_id=any(v_order_ids)
    or (action='ACCEPT_OFFER' and safe_change_metadata->>'offer_id' in (
      '41500000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002'));
  delete from internal.idempotency_records where resource_id=any(v_order_ids)
    or (actor_profile_id='20000000-0000-4000-8000-000000000001' and operation_type='ACCEPT_OFFER');
  delete from public.orders where id=any(v_order_ids);

  update public.produce_listings set crop_id='30000000-0000-4000-8000-000000000001',variety_id='31000000-0000-4000-8000-000000000001',
    quantity=1000,available_quantity=1000,unit='kg',status='ACTIVE',version=1,
    harvest_date=current_date-2,available_from=current_date,available_until=current_date+3
  where id='40000000-0000-4000-8000-000000000001';
  update public.buyer_demands set buyer_profile_id='20000000-0000-4000-8000-000000000002',fpo_id=null,
    crop_id='30000000-0000-4000-8000-000000000001',variety_id='31000000-0000-4000-8000-000000000001',
    minimum_quantity=1000,maximum_quantity=1000,fulfilled_quantity=0,unit='kg',currency='INR',status='ACTIVE',version=1,
    delivery_from=current_date,delivery_until=current_date+3 where id='41000000-0000-4000-8000-000000000001';
  update public.buyer_demands set buyer_profile_id='20000000-0000-4000-8000-000000000003',fpo_id=null,
    crop_id='30000000-0000-4000-8000-000000000001',variety_id='31000000-0000-4000-8000-000000000001',
    minimum_quantity=1000,maximum_quantity=1000,fulfilled_quantity=0,unit='kg',currency='INR',status='ACTIVE',version=1,
    delivery_from=current_date,delivery_until=current_date+3 where id='41000000-0000-4000-8000-000000000002';
  update public.offers set listing_id='40000000-0000-4000-8000-000000000001',demand_id='41000000-0000-4000-8000-000000000001',
    buyer_profile_id='20000000-0000-4000-8000-000000000002',fpo_id=null,offered_quantity=1000,unit='kg',unit_price=32,currency='INR',
    status='PENDING',version=1,expires_at=now()+interval '24 hours' where id='41500000-0000-4000-8000-000000000001';
  update public.offers set listing_id='40000000-0000-4000-8000-000000000001',demand_id='41000000-0000-4000-8000-000000000002',
    buyer_profile_id='20000000-0000-4000-8000-000000000003',fpo_id=null,offered_quantity=1000,unit='kg',unit_price=31,currency='INR',
    status='PENDING',version=1,expires_at=now()+interval '24 hours' where id='41500000-0000-4000-8000-000000000002';
  update public.logistics_quotes set listing_id='40000000-0000-4000-8000-000000000001',demand_id='41000000-0000-4000-8000-000000000001',
    transportation_cost=5500,storage_cost=500,handling_cost=300,other_applicable_cost=200,total_applicable_cost=6500,currency='INR',
    calculated_at=now(),expires_at=now()+interval '24 hours' where id='42000000-0000-4000-8000-000000000001' and data_mode='DEMO';
  update public.logistics_quotes set listing_id='40000000-0000-4000-8000-000000000001',demand_id='41000000-0000-4000-8000-000000000002',
    transportation_cost=1500,storage_cost=300,handling_cost=300,other_applicable_cost=150,total_applicable_cost=2250,currency='INR',
    calculated_at=now(),expires_at=now()+interval '24 hours' where id='42000000-0000-4000-8000-000000000002' and data_mode='DEMO';
  update public.recommendations set farmer_profile_id='20000000-0000-4000-8000-000000000001',listing_id='40000000-0000-4000-8000-000000000001',
    candidate_buyer_profile_id='20000000-0000-4000-8000-000000000002',candidate_fpo_id=null,candidate_mandi_id=null,
    demand_id='41000000-0000-4000-8000-000000000001',logistics_quote_id='42000000-0000-4000-8000-000000000001',
    estimated_quantity_kg=1000,estimated_unit_price_per_kg=32,estimated_gross_selling_value=32000,
    estimated_transportation_cost=5500,estimated_storage_cost=500,estimated_handling_cost=300,estimated_other_applicable_cost=200,
    estimated_total_applicable_cost=6500,estimated_net_farmer_realization=25500,currency='INR',rank=2,data_mode='DEMO',
    calculated_at=now(),expires_at=now()+interval '24 hours',input_metadata=input_metadata||jsonb_build_object('reset_at',now(),'demo_label','DEMO DATA — NOT LIVE GOVERNMENT DATA')
    where id='43000000-0000-4000-8000-000000000001';
  update public.recommendations set farmer_profile_id='20000000-0000-4000-8000-000000000001',listing_id='40000000-0000-4000-8000-000000000001',
    candidate_buyer_profile_id='20000000-0000-4000-8000-000000000003',candidate_fpo_id=null,candidate_mandi_id=null,
    demand_id='41000000-0000-4000-8000-000000000002',logistics_quote_id='42000000-0000-4000-8000-000000000002',
    estimated_quantity_kg=1000,estimated_unit_price_per_kg=31,estimated_gross_selling_value=31000,
    estimated_transportation_cost=1500,estimated_storage_cost=300,estimated_handling_cost=300,estimated_other_applicable_cost=150,
    estimated_total_applicable_cost=2250,estimated_net_farmer_realization=28750,currency='INR',rank=1,data_mode='DEMO',
    calculated_at=now(),expires_at=now()+interval '24 hours',input_metadata=input_metadata||jsonb_build_object('reset_at',now(),'demo_label','DEMO DATA — NOT LIVE GOVERNMENT DATA')
    where id='43000000-0000-4000-8000-000000000002';

  if not exists(select 1 from public.recommendations where id='43000000-0000-4000-8000-000000000001' and estimated_net_farmer_realization=25500)
     or not exists(select 1 from public.recommendations where id='43000000-0000-4000-8000-000000000002' and estimated_net_farmer_realization=28750 and rank=1) then
    perform internal.raise_domain_error('DEMO_DATA_INVALID',409);
  end if;
end $$;

revoke all on function internal.prevent_mutation(),internal.reset_sih_demo() from public,anon,authenticated;
grant execute on function internal.reset_sih_demo() to service_role;
