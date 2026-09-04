-- Phase 2B acceptance hardening.
-- Rollback: drop the new accept_offer signature and restore migration 015's function.

create or replace function internal.raise_domain_error(
  p_code text,
  p_http_status integer,
  p_context jsonb default '{}'::jsonb
) returns void
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = 'AGRINEXIS_DOMAIN_ERROR',
    detail = format('AGRINEXIS_CODE=%s;HTTP_STATUS=%s', p_code, p_http_status),
    hint = coalesce(p_context, '{}'::jsonb)::text;
end $$;

revoke all on function internal.raise_domain_error(text,integer,jsonb) from public, anon, authenticated;

drop function internal.accept_offer(uuid,uuid,integer,integer,uuid,uuid,text,text,numeric,numeric,numeric);

create function internal.accept_offer(
  p_actor_profile_id uuid,
  p_offer_id uuid,
  p_offer_version integer,
  p_listing_version integer,
  p_logistics_quote_id uuid,
  p_recommendation_id uuid,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_ack_gross numeric(14,2),
  p_ack_total_cost numeric(14,2),
  p_ack_nfr numeric(14,2),
  p_ack_currency char(3)
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, public, internal
as $$
declare
  v_offer public.offers%rowtype;
  v_listing public.produce_listings%rowtype;
  v_quote public.logistics_quotes%rowtype;
  v_recommendation public.recommendations%rowtype;
  v_demand public.buyer_demands%rowtype;
  v_existing internal.idempotency_records%rowtype;
  v_marker_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_gross numeric(14,2);
  v_nfr numeric(14,2);
  v_demand_remaining numeric(14,3);
  v_counterparty text;
begin
  if auth.uid() is not null and internal.current_profile_id() is distinct from p_actor_profile_id then
    perform internal.raise_domain_error('ACTOR_MISMATCH', 403);
  end if;

  select * into v_existing from internal.idempotency_records
  where actor_profile_id=p_actor_profile_id and service_scope is null
    and operation_type='ACCEPT_OFFER' and idempotency_key=p_idempotency_key;

  if found and v_existing.status='SUCCEEDED' then
    if v_existing.request_fingerprint is distinct from p_request_fingerprint then
      perform internal.raise_domain_error('IDEMPOTENCY_CONFLICT', 409);
    end if;
    if v_existing.resource_id is not null then return v_existing.resource_id; end if;
    perform internal.raise_domain_error('IDEMPOTENCY_CONFLICT', 409);
  elsif found and v_existing.status='IN_PROGRESS' then
    perform internal.raise_domain_error('IDEMPOTENCY_CONFLICT', 409);
  elsif found and v_existing.status='FAILED' then
    delete from internal.idempotency_records where id=v_existing.id;
  end if;

  insert into internal.idempotency_records(actor_profile_id,operation_type,idempotency_key,request_fingerprint,status,expires_at)
  values (p_actor_profile_id,'ACCEPT_OFFER',p_idempotency_key,p_request_fingerprint,'IN_PROGRESS',now()+interval '24 hours')
  on conflict do nothing returning id into v_marker_id;
  if v_marker_id is null then
    select * into v_existing from internal.idempotency_records
    where actor_profile_id=p_actor_profile_id and service_scope is null
      and operation_type='ACCEPT_OFFER' and idempotency_key=p_idempotency_key;
    if v_existing.status='SUCCEEDED' and v_existing.request_fingerprint is not distinct from p_request_fingerprint
       and v_existing.resource_id is not null then return v_existing.resource_id; end if;
    perform internal.raise_domain_error('IDEMPOTENCY_CONFLICT', 409);
  end if;

  select * into v_offer from public.offers where id=p_offer_id for update;
  if not found or v_offer.status <> 'PENDING' then perform internal.raise_domain_error('OFFER_NOT_PENDING',409); end if;
  if v_offer.expires_at <= now() then perform internal.raise_domain_error('OFFER_EXPIRED',409); end if;
  if v_offer.version <> p_offer_version then perform internal.raise_domain_error('OFFER_VERSION_CONFLICT',409); end if;

  select * into v_listing from public.produce_listings where id=v_offer.listing_id for update;
  if not found or v_listing.farmer_profile_id <> p_actor_profile_id then perform internal.raise_domain_error('ACTOR_MISMATCH',403); end if;
  if v_listing.version <> p_listing_version or v_listing.status not in ('ACTIVE','RESERVED') then
    perform internal.raise_domain_error('LISTING_VERSION_CONFLICT',409);
  end if;
  if v_listing.available_quantity < v_offer.offered_quantity then perform internal.raise_domain_error('INSUFFICIENT_QUANTITY',409); end if;

  select * into v_quote from public.logistics_quotes where id=p_logistics_quote_id;
  if not found or v_quote.listing_id <> v_listing.id
     or v_quote.demand_id is distinct from v_offer.demand_id then
    perform internal.raise_domain_error('QUOTE_INVALID',422);
  end if;
  if v_quote.expires_at <= now() then perform internal.raise_domain_error('QUOTE_EXPIRED',422); end if;
  if btrim(p_ack_currency::text) <> btrim(v_offer.currency::text)
     or btrim(v_quote.currency::text) <> btrim(v_offer.currency::text) then
    perform internal.raise_domain_error('CURRENCY_MISMATCH',409);
  end if;

  if p_recommendation_id is not null then
    select * into v_recommendation from public.recommendations where id=p_recommendation_id;
    if not found or v_recommendation.listing_id <> v_listing.id
       or v_recommendation.farmer_profile_id <> v_listing.farmer_profile_id
       or v_recommendation.candidate_buyer_profile_id is distinct from v_offer.buyer_profile_id
       or v_recommendation.candidate_fpo_id is distinct from v_offer.fpo_id
       or v_recommendation.candidate_mandi_id is not null
       or v_recommendation.demand_id is distinct from v_offer.demand_id
       or (v_recommendation.logistics_quote_id is not null and v_recommendation.logistics_quote_id <> v_quote.id)
       or btrim(v_recommendation.currency::text) <> btrim(v_offer.currency::text)
       or v_recommendation.estimated_quantity_kg <> v_offer.offered_quantity
       or v_recommendation.estimated_unit_price_per_kg <> v_offer.unit_price
       or v_recommendation.estimated_gross_selling_value <> round(v_offer.offered_quantity*v_offer.unit_price,2)
       or v_recommendation.estimated_transportation_cost <> v_quote.transportation_cost
       or v_recommendation.estimated_storage_cost <> v_quote.storage_cost
       or v_recommendation.estimated_handling_cost <> v_quote.handling_cost
       or v_recommendation.estimated_other_applicable_cost <> v_quote.other_applicable_cost
       or v_recommendation.estimated_total_applicable_cost <> v_quote.total_applicable_cost then
      perform internal.raise_domain_error('RECOMMENDATION_INVALID',422);
    end if;
    if v_recommendation.expires_at <= now() then perform internal.raise_domain_error('RECOMMENDATION_EXPIRED',422); end if;
  end if;

  if v_offer.demand_id is not null then
    select * into v_demand from public.buyer_demands where id=v_offer.demand_id for update;
    if not found or v_demand.status not in ('ACTIVE','PARTIALLY_FILLED')
       or v_demand.crop_id <> v_listing.crop_id
       or (v_demand.variety_id is not null and v_demand.variety_id is distinct from v_listing.variety_id)
       or v_demand.buyer_profile_id is distinct from v_offer.buyer_profile_id
       or v_demand.fpo_id is distinct from v_offer.fpo_id
       or btrim(v_demand.currency::text) <> btrim(v_offer.currency::text)
       or current_date < v_demand.delivery_from then
      perform internal.raise_domain_error('DEMAND_INVALID',422);
    end if;
    if current_date > v_demand.delivery_until then perform internal.raise_domain_error('DEMAND_EXPIRED',422); end if;
    v_demand_remaining := v_demand.maximum_quantity-v_demand.fulfilled_quantity;
    if v_offer.offered_quantity > v_demand_remaining then perform internal.raise_domain_error('DEMAND_QUANTITY_EXCEEDED',409); end if;
  end if;

  v_gross := round(v_offer.offered_quantity*v_offer.unit_price,2);
  v_nfr := v_gross-v_quote.total_applicable_cost;
  if p_ack_gross is distinct from v_gross or p_ack_total_cost is distinct from v_quote.total_applicable_cost
     or p_ack_nfr is distinct from v_nfr then perform internal.raise_domain_error('FINANCIALS_CHANGED',409); end if;

  if v_offer.buyer_profile_id is not null then
    select display_name into v_counterparty from public.profiles where id=v_offer.buyer_profile_id;
  else
    select display_name into v_counterparty from public.fpos where id=v_offer.fpo_id;
  end if;

  insert into public.orders(id,farmer_profile_id,buyer_profile_id,fpo_id,listing_id,accepted_offer_id,logistics_quote_id,source_recommendation_id,
    snapshot_currency,snapshot_quantity_kg,snapshot_unit_price_per_kg,snapshot_gross_selling_value,snapshot_transportation_cost,
    snapshot_storage_cost,snapshot_handling_cost,snapshot_other_applicable_cost,snapshot_total_applicable_cost,snapshot_net_farmer_realization,
    snapshot_calculation_version,snapshot_calculated_at,farmer_display_name_snapshot,counterparty_display_name_snapshot,status,accepted_at)
  values (v_order_id,v_listing.farmer_profile_id,v_offer.buyer_profile_id,v_offer.fpo_id,v_listing.id,v_offer.id,v_quote.id,p_recommendation_id,
    v_offer.currency,v_offer.offered_quantity,v_offer.unit_price,v_gross,v_quote.transportation_cost,v_quote.storage_cost,v_quote.handling_cost,
    v_quote.other_applicable_cost,v_quote.total_applicable_cost,v_nfr,'nfr-v1',now(),
    (select display_name from public.profiles where id=v_listing.farmer_profile_id),v_counterparty,'CONFIRMED',now());

  update public.offers set status='ACCEPTED',version=version+1 where id=v_offer.id;
  update public.produce_listings set available_quantity=available_quantity-v_offer.offered_quantity,
    status=case when available_quantity-v_offer.offered_quantity=0 then 'SOLD'::public.listing_status else 'ACTIVE'::public.listing_status end,
    version=version+1 where id=v_listing.id;
  if v_offer.demand_id is not null then
    update public.buyer_demands set fulfilled_quantity=fulfilled_quantity+v_offer.offered_quantity,
      status=case when fulfilled_quantity+v_offer.offered_quantity=maximum_quantity then 'FULFILLED'::public.demand_status else 'PARTIALLY_FILLED'::public.demand_status end,
      version=version+1 where id=v_offer.demand_id;
  end if;

  update internal.idempotency_records set status='SUCCEEDED',resource_type='order',resource_id=v_order_id
    where id=v_marker_id;
  insert into internal.audit_events(actor_profile_id,action,resource_type,resource_id,outcome,safe_change_metadata)
  values (p_actor_profile_id,'ACCEPT_OFFER','order',v_order_id,'SUCCESS',jsonb_build_object('offer_id',v_offer.id,'listing_id',v_listing.id));
  return v_order_id;
end $$;

revoke all on function internal.accept_offer(uuid,uuid,integer,integer,uuid,uuid,text,text,numeric,numeric,numeric,character) from public, anon, authenticated;
grant execute on function internal.accept_offer(uuid,uuid,integer,integer,uuid,uuid,text,text,numeric,numeric,numeric,character) to service_role;
