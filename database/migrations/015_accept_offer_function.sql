-- Atomic backend-only offer acceptance. Rollback: drop function with this signature.
create or replace function internal.accept_offer(
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
  p_ack_nfr numeric(14,2)
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, public, internal
as $$
declare
  v_offer public.offers%rowtype;
  v_listing public.produce_listings%rowtype;
  v_quote public.logistics_quotes%rowtype;
  v_existing internal.idempotency_records%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_gross numeric(14,2);
  v_nfr numeric(14,2);
  v_counterparty text;
begin
  if auth.uid() is not null and internal.current_profile_id() is distinct from p_actor_profile_id then
    raise exception 'actor does not match authenticated profile' using errcode='42501';
  end if;

  select * into v_existing from internal.idempotency_records
    where actor_profile_id=p_actor_profile_id and service_scope is null
      and operation_type='ACCEPT_OFFER' and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_fingerprint is distinct from p_request_fingerprint then
      raise exception 'idempotency key reused with different request' using errcode='23505';
    end if;
    if v_existing.status='SUCCEEDED' and v_existing.resource_id is not null then return v_existing.resource_id; end if;
    raise exception 'acceptance already in progress or previously failed' using errcode='40001';
  end if;

  insert into internal.idempotency_records(actor_profile_id,operation_type,idempotency_key,request_fingerprint,status,expires_at)
  values (p_actor_profile_id,'ACCEPT_OFFER',p_idempotency_key,p_request_fingerprint,'IN_PROGRESS',now()+interval '24 hours');

  select * into v_offer from public.offers where id=p_offer_id for update;
  if not found or v_offer.status <> 'PENDING' or v_offer.expires_at <= now() or v_offer.version <> p_offer_version then
    raise exception 'offer is unavailable, expired, or version-conflicted' using errcode='40001';
  end if;
  select * into v_listing from public.produce_listings where id=v_offer.listing_id for update;
  if not found or v_listing.farmer_profile_id <> p_actor_profile_id or v_listing.status not in ('ACTIVE','RESERVED')
     or v_listing.version <> p_listing_version or v_listing.available_quantity < v_offer.offered_quantity then
    raise exception 'listing unavailable, unauthorized, or version-conflicted' using errcode='40001';
  end if;
  select * into v_quote from public.logistics_quotes where id=p_logistics_quote_id and listing_id=v_listing.id;
  if not found or v_quote.expires_at <= now() or v_quote.currency <> v_offer.currency then
    raise exception 'trusted logistics quote unavailable or expired' using errcode='23514';
  end if;
  if p_recommendation_id is not null and not exists (
    select 1 from public.recommendations where id=p_recommendation_id and listing_id=v_listing.id and expires_at>now()
  ) then raise exception 'recommendation unavailable or expired' using errcode='23514'; end if;

  v_gross := round(v_offer.offered_quantity * v_offer.unit_price, 2);
  v_nfr := v_gross - v_quote.total_applicable_cost;
  if p_ack_gross is distinct from v_gross or p_ack_total_cost is distinct from v_quote.total_applicable_cost or p_ack_nfr is distinct from v_nfr then
    raise exception 'FINANCIALS_CHANGED' using errcode='40001';
  end if;

  if v_offer.buyer_profile_id is not null then
    select display_name into v_counterparty from public.profiles where id=v_offer.buyer_profile_id;
  else
    select display_name into v_counterparty from public.fpos where id=v_offer.fpo_id;
  end if;

  insert into public.orders(id,farmer_profile_id,buyer_profile_id,fpo_id,listing_id,accepted_offer_id,logistics_quote_id,source_recommendation_id,
    snapshot_currency,snapshot_quantity_kg,snapshot_unit_price_per_kg,snapshot_gross_selling_value,snapshot_transportation_cost,
    snapshot_storage_cost,snapshot_handling_cost,snapshot_other_applicable_cost,snapshot_total_applicable_cost,snapshot_net_farmer_realization,
    snapshot_calculation_version,snapshot_calculated_at,farmer_display_name_snapshot,counterparty_display_name_snapshot,status,accepted_at)
  values (v_order_id,v_listing.farmer_profile_id,v_offer.buyer_profile_id,v_offer.fpo_id,v_listing.id,v_offer.id,p_logistics_quote_id,p_recommendation_id,
    v_offer.currency,v_offer.offered_quantity,v_offer.unit_price,v_gross,v_quote.transportation_cost,v_quote.storage_cost,v_quote.handling_cost,
    v_quote.other_applicable_cost,v_quote.total_applicable_cost,v_nfr,'nfr-v1',now(),
    (select display_name from public.profiles where id=v_listing.farmer_profile_id),v_counterparty,'CONFIRMED',now());

  update public.offers set status='ACCEPTED',version=version+1 where id=v_offer.id;
  update public.produce_listings set available_quantity=available_quantity-v_offer.offered_quantity,
    status=case when available_quantity-v_offer.offered_quantity=0 then 'SOLD'::public.listing_status else 'RESERVED'::public.listing_status end,
    version=version+1 where id=v_listing.id;
  if v_offer.demand_id is not null then
    perform 1 from public.buyer_demands where id=v_offer.demand_id for update;
    update public.buyer_demands set fulfilled_quantity=fulfilled_quantity+v_offer.offered_quantity,
      status=case when fulfilled_quantity+v_offer.offered_quantity>=maximum_quantity then 'FULFILLED'::public.demand_status else 'PARTIALLY_FILLED'::public.demand_status end,
      version=version+1 where id=v_offer.demand_id;
  end if;

  update internal.idempotency_records set status='SUCCEEDED',resource_type='order',resource_id=v_order_id
    where actor_profile_id=p_actor_profile_id and service_scope is null and operation_type='ACCEPT_OFFER' and idempotency_key=p_idempotency_key;
  insert into internal.audit_events(actor_profile_id,action,resource_type,resource_id,outcome,safe_change_metadata)
    values (p_actor_profile_id,'ACCEPT_OFFER','order',v_order_id,'SUCCESS',jsonb_build_object('offer_id',v_offer.id,'listing_id',v_listing.id));
  return v_order_id;
exception when others then
  -- The transaction rollback also removes an in-transaction idempotency marker;
  -- callers persist failure outcomes separately if desired.
  raise;
end $$;

revoke all on function internal.accept_offer(uuid,uuid,integer,integer,uuid,uuid,text,text,numeric,numeric,numeric) from public, anon, authenticated;
grant usage on schema internal to service_role;
grant execute on function internal.accept_offer(uuid,uuid,integer,integer,uuid,uuid,text,text,numeric,numeric,numeric) to service_role;
