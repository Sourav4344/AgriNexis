-- Privileged helpers are isolated, have fixed search paths, and are not directly callable by clients.
create or replace function internal.current_profile_id()
returns uuid language sql stable security definer set search_path = pg_catalog, public, internal
as $$ select id from public.profiles where user_id = auth.uid() and status = 'ACTIVE' limit 1 $$;

create or replace function internal.current_role()
returns public.app_role language sql stable security definer set search_path = pg_catalog, public, internal
as $$ select role from public.profiles where user_id = auth.uid() and status = 'ACTIVE' limit 1 $$;

create or replace function internal.is_admin()
returns boolean language sql stable security definer set search_path = pg_catalog, public, internal
as $$ select coalesce(internal.current_role() = 'ADMIN', false) $$;

create or replace function internal.operates_fpo(target_fpo uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, internal
as $$ select exists (select 1 from public.fpo_operators where fpo_id = target_fpo and profile_id = internal.current_profile_id() and status = 'ACTIVE') $$;

create or replace function internal.is_order_party(target_order uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, internal
as $$ select exists (
  select 1 from public.orders o where o.id = target_order and
  (o.farmer_profile_id = internal.current_profile_id() or o.buyer_profile_id = internal.current_profile_id() or internal.operates_fpo(o.fpo_id))
) $$;

revoke all on function internal.current_profile_id(), internal.current_role(), internal.is_admin(), internal.operates_fpo(uuid), internal.is_order_party(uuid) from public;
grant usage on schema internal to authenticated;
grant execute on function internal.current_profile_id(), internal.current_role(), internal.is_admin(), internal.operates_fpo(uuid), internal.is_order_party(uuid) to authenticated;

create or replace function internal.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function internal.enforce_profile_security()
returns trigger language plpgsql set search_path = pg_catalog, public, internal
as $$ begin
  if tg_op = 'UPDATE' and auth.uid() is not null and (new.role <> old.role or new.status <> old.status or new.user_id <> old.user_id) and not internal.is_admin() then
    raise exception 'role, account status, and auth identity are privileged fields' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function internal.enforce_fpo_operator_role()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$ begin
  if not exists (select 1 from public.profiles where id = new.profile_id and role = 'FPO' and status = 'ACTIVE') then
    raise exception 'active FPO role required for operator association' using errcode = '23514';
  end if;
  return new;
end $$;

create or replace function internal.prevent_mutation()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin raise exception '% is append-only', tg_table_name using errcode = '55000'; end $$;

create or replace function internal.protect_order_snapshot()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin
  if row(new.snapshot_currency,new.snapshot_quantity_kg,new.snapshot_unit_price_per_kg,new.snapshot_gross_selling_value,
    new.snapshot_transportation_cost,new.snapshot_storage_cost,new.snapshot_handling_cost,new.snapshot_other_applicable_cost,
    new.snapshot_total_applicable_cost,new.snapshot_net_farmer_realization,new.snapshot_calculation_version,new.snapshot_calculated_at,
    new.accepted_offer_id,new.listing_id,new.farmer_profile_id,new.buyer_profile_id,new.fpo_id)
    is distinct from
    row(old.snapshot_currency,old.snapshot_quantity_kg,old.snapshot_unit_price_per_kg,old.snapshot_gross_selling_value,
    old.snapshot_transportation_cost,old.snapshot_storage_cost,old.snapshot_handling_cost,old.snapshot_other_applicable_cost,
    old.snapshot_total_applicable_cost,old.snapshot_net_farmer_realization,old.snapshot_calculation_version,old.snapshot_calculated_at,
    old.accepted_offer_id,old.listing_id,old.farmer_profile_id,old.buyer_profile_id,old.fpo_id) then
    raise exception 'accepted order identity and financial snapshot are immutable' using errcode = '55000';
  end if;
  return new;
end $$;

create or replace function internal.valid_order_transition(from_status public.order_status, to_status public.order_status)
returns boolean language sql immutable set search_path = pg_catalog
as $$ select case
  when from_status = 'CONFIRMED' then to_status in ('PICKUP_SCHEDULED','CANCELLED','DISPUTED')
  when from_status = 'PICKUP_SCHEDULED' then to_status in ('IN_TRANSIT','CANCELLED','DISPUTED')
  when from_status = 'IN_TRANSIT' then to_status in ('DELIVERED','DISPUTED')
  when from_status = 'DELIVERED' then to_status in ('COMPLETED','DISPUTED')
  else false end $$;

create or replace function internal.enforce_order_transition()
returns trigger language plpgsql set search_path = pg_catalog, public, internal
as $$ begin
  if new.status <> old.status then
    if not internal.valid_order_transition(old.status, new.status) then
      raise exception 'invalid order transition: % -> %', old.status, new.status using errcode = '23514';
    end if;
    new.version = old.version + 1;
    insert into public.order_status_history(order_id, previous_status, new_status, actor_profile_id, changed_at)
    values (old.id, old.status, new.status, internal.current_profile_id(), now());
  end if;
  return new;
end $$;

create or replace function internal.record_initial_order_status()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$ begin insert into public.order_status_history(order_id, previous_status, new_status, changed_at) values (new.id, null, new.status, new.created_at); return new; end $$;

create or replace function internal.enforce_rating_eligibility()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$ declare o public.orders%rowtype; begin
  select * into o from public.orders where id = new.order_id;
  if not found or o.status <> 'COMPLETED' then
    raise exception 'ratings require a completed order' using errcode = '23514';
  end if;
  if new.rater_profile_id = o.farmer_profile_id then
    if not ((o.buyer_profile_id is not null and new.ratee_profile_id = o.buyer_profile_id and new.ratee_fpo_id is null)
      or (o.fpo_id is not null and new.ratee_fpo_id = o.fpo_id and new.ratee_profile_id is null)) then
      raise exception 'farmer may rate only the order counterparty' using errcode = '23514';
    end if;
  elsif o.buyer_profile_id = new.rater_profile_id then
    if new.ratee_profile_id is distinct from o.farmer_profile_id or new.ratee_fpo_id is not null then
      raise exception 'buyer may rate only the order farmer' using errcode = '23514';
    end if;
  elsif o.fpo_id is not null and exists (select 1 from public.fpo_operators where fpo_id=o.fpo_id and profile_id=new.rater_profile_id and status='ACTIVE') then
    if new.ratee_profile_id is distinct from o.farmer_profile_id or new.ratee_fpo_id is not null then
      raise exception 'FPO operator may rate only the order farmer' using errcode = '23514';
    end if;
  else
    raise exception 'rater is not an order party' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger profiles_security before update on public.profiles for each row execute function internal.enforce_profile_security();
create trigger fpo_operator_role before insert or update on public.fpo_operators for each row execute function internal.enforce_fpo_operator_role();
create trigger orders_snapshot_immutable before update on public.orders for each row execute function internal.protect_order_snapshot();
create trigger orders_transition before update of status on public.orders for each row execute function internal.enforce_order_transition();
create trigger orders_initial_history after insert on public.orders for each row execute function internal.record_initial_order_status();
create trigger order_history_append_only before update or delete on public.order_status_history for each row execute function internal.prevent_mutation();
create trigger market_observations_append_only before update or delete on public.mandi_prices for each row execute function internal.prevent_mutation();
create trigger price_history_append_only before update or delete on public.price_history for each row execute function internal.prevent_mutation();
create trigger adjustments_no_delete before delete on public.order_financial_adjustments for each row execute function internal.prevent_mutation();
create trigger grievance_messages_append_only before update or delete on public.grievance_messages for each row execute function internal.prevent_mutation();
create trigger audit_append_only before update or delete on internal.audit_events for each row execute function internal.prevent_mutation();
create trigger rating_eligibility before insert on public.ratings for each row execute function internal.enforce_rating_eligibility();

do $$ declare t text; begin
  foreach t in array array['profiles','farmer_profiles','buyer_profiles','fpos','fpo_members','fpo_operators','crops','crop_varieties','mandis','produce_listings','listing_private_locations','quality_reports','buyer_demands','offers','transport_providers','warehouses','orders','payments','ratings','notification_devices','grievances'] loop
    execute format('create trigger %I before update on public.%I for each row execute function internal.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

revoke all on function internal.set_updated_at(), internal.enforce_profile_security(), internal.enforce_fpo_operator_role(), internal.prevent_mutation(), internal.protect_order_snapshot(), internal.valid_order_transition(public.order_status,public.order_status), internal.enforce_order_transition(), internal.record_initial_order_status(), internal.enforce_rating_eligibility() from public, anon, authenticated;
