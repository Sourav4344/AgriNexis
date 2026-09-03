-- Deny by default, then grant only named operations. The backend service role bypasses RLS.
do $$ declare t text; begin
  foreach t in array array[
    'profiles','farmer_profiles','buyer_profiles','fpos','fpo_members','fpo_operators','crops','crop_varieties','mandis','mandi_prices','price_history',
    'produce_listings','listing_private_locations','quality_reports','quality_assets','buyer_demands','offers','transport_providers','warehouses',
    'logistics_quotes','recommendations','orders','order_status_history','order_financial_adjustments','payments','ratings','notifications',
    'notification_devices','grievances','grievance_messages'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (internal.is_admin()) with check (internal.is_admin())', t);
  end loop;
end $$;

grant select on public.crops, public.crop_varieties, public.mandis, public.mandi_prices, public.price_history,
  public.transport_providers, public.warehouses to authenticated;
create policy authenticated_read on public.crops for select to authenticated using (internal.current_profile_id() is not null);
create policy authenticated_read on public.crop_varieties for select to authenticated using (internal.current_profile_id() is not null);
create policy authenticated_read on public.mandis for select to authenticated using (internal.current_profile_id() is not null);
create policy authenticated_read on public.mandi_prices for select to authenticated using (internal.current_profile_id() is not null);
create policy authenticated_read on public.price_history for select to authenticated using (internal.current_profile_id() is not null);
create policy authenticated_read on public.transport_providers for select to authenticated using (internal.current_profile_id() is not null and status = 'ACTIVE');
create policy authenticated_read on public.warehouses for select to authenticated using (internal.current_profile_id() is not null and status = 'ACTIVE');

grant select on public.profiles, public.farmer_profiles, public.buyer_profiles to authenticated;
grant update (display_name, phone, preferred_locale) on public.profiles to authenticated;
grant update (farm_summary, district, state, postal_area) on public.farmer_profiles to authenticated;
grant update (organization_name, trade_reference) on public.buyer_profiles to authenticated;
create policy profile_self_read on public.profiles for select to authenticated using (id = internal.current_profile_id());
create policy profile_self_update on public.profiles for update to authenticated using (id = internal.current_profile_id()) with check (id = internal.current_profile_id());
create policy farmer_self on public.farmer_profiles for all to authenticated using (profile_id = internal.current_profile_id()) with check (profile_id = internal.current_profile_id());
create policy buyer_self_read on public.buyer_profiles for select to authenticated using (profile_id = internal.current_profile_id());
create policy buyer_self_update on public.buyer_profiles for update to authenticated using (profile_id = internal.current_profile_id()) with check (profile_id = internal.current_profile_id());

grant select on public.fpos, public.fpo_members, public.fpo_operators to authenticated;
create policy fpo_authenticated_read on public.fpos for select to authenticated using (internal.current_profile_id() is not null);
create policy membership_self_or_operator on public.fpo_members for select to authenticated using (farmer_profile_id = internal.current_profile_id() or internal.operates_fpo(fpo_id));
create policy operator_self_or_peer on public.fpo_operators for select to authenticated using (profile_id = internal.current_profile_id() or internal.operates_fpo(fpo_id));

grant select on public.produce_listings to authenticated;
grant insert (farmer_profile_id,crop_id,variety_id,quantity,available_quantity,unit,harvest_date,available_from,available_until,district,state,postal_area,quality_summary) on public.produce_listings to authenticated;
grant update (crop_id,variety_id,quantity,unit,harvest_date,available_from,available_until,district,state,postal_area,quality_summary) on public.produce_listings to authenticated;
create policy listing_owner_read on public.produce_listings for select to authenticated using (farmer_profile_id = internal.current_profile_id());
create policy listing_owner_insert on public.produce_listings for insert to authenticated with check (farmer_profile_id = internal.current_profile_id() and status='DRAFT' and available_quantity=quantity);
create policy listing_owner_update on public.produce_listings for update to authenticated using (farmer_profile_id = internal.current_profile_id()) with check (farmer_profile_id = internal.current_profile_id());
create policy listing_verified_discovery on public.produce_listings for select to authenticated using (
  status = 'ACTIVE' and deleted_at is null and (
    exists (select 1 from public.buyer_profiles b where b.profile_id = internal.current_profile_id() and b.verification_status = 'VERIFIED' and b.reliability_status = 'ACTIVE')
    or exists (select 1 from public.fpo_operators o join public.fpos f on f.id=o.fpo_id where o.profile_id=internal.current_profile_id() and o.status='ACTIVE' and f.verification_status='VERIFIED')
  )
);

grant select, insert, update on public.listing_private_locations to authenticated;
create policy private_location_owner on public.listing_private_locations for all to authenticated using (
  exists (select 1 from public.produce_listings l where l.id=listing_id and l.farmer_profile_id=internal.current_profile_id())
) with check (exists (select 1 from public.produce_listings l where l.id=listing_id and l.farmer_profile_id=internal.current_profile_id()));
create policy private_location_order_party on public.listing_private_locations for select to authenticated using (
  exists (select 1 from public.orders o where o.listing_id=listing_id and internal.is_order_party(o.id))
);

grant select on public.quality_reports, public.quality_assets to authenticated;
grant insert (listing_id,method,source_name,observations,confidence,limitations,model_version,data_mode,dataset_id,source_timestamp,fetched_at,checksum) on public.quality_reports to authenticated;
grant insert (quality_report_id,storage_object_path,mime_type,size_bytes,checksum) on public.quality_assets to authenticated;
create policy quality_listing_party on public.quality_reports for select to authenticated using (
  exists (select 1 from public.produce_listings l where l.id=listing_id and (l.farmer_profile_id=internal.current_profile_id() or
    exists (select 1 from public.orders o where o.listing_id=l.id and internal.is_order_party(o.id))))
);
create policy quality_owner_insert on public.quality_reports for insert to authenticated with check (
  exists (select 1 from public.produce_listings l where l.id=listing_id and l.farmer_profile_id=internal.current_profile_id())
);
create policy quality_asset_party on public.quality_assets for select to authenticated using (
  exists (select 1 from public.quality_reports q join public.produce_listings l on l.id=q.listing_id where q.id=quality_report_id and
    (l.farmer_profile_id=internal.current_profile_id() or exists (select 1 from public.orders o where o.listing_id=l.id and internal.is_order_party(o.id))))
);
create policy quality_asset_owner_insert on public.quality_assets for insert to authenticated with check (
  exists (select 1 from public.quality_reports q join public.produce_listings l on l.id=q.listing_id where q.id=quality_report_id and l.farmer_profile_id=internal.current_profile_id())
);

grant select on public.buyer_demands to authenticated;
grant insert (buyer_profile_id,fpo_id,crop_id,variety_id,minimum_quantity,maximum_quantity,unit,quality_requirements,delivery_from,delivery_until,delivery_district,delivery_state,indicative_price,currency) on public.buyer_demands to authenticated;
grant update (crop_id,variety_id,minimum_quantity,maximum_quantity,unit,quality_requirements,delivery_from,delivery_until,delivery_district,delivery_state,indicative_price,currency) on public.buyer_demands to authenticated;
create policy demand_owner_read on public.buyer_demands for select to authenticated using (
  buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id)
);
create policy demand_owner_insert on public.buyer_demands for insert to authenticated with check (
  status='DRAFT' and fulfilled_quantity=0 and (buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id))
);
create policy demand_owner_update on public.buyer_demands for update to authenticated using (
  buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id)
) with check (buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id));
create policy demand_farmer_discovery on public.buyer_demands for select to authenticated using (status in ('ACTIVE','PARTIALLY_FILLED') and internal.current_role()='FARMER');

grant select, insert on public.offers to authenticated;
create policy offer_parties_read on public.offers for select to authenticated using (
  buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id) or
  exists (select 1 from public.produce_listings l where l.id=listing_id and l.farmer_profile_id=internal.current_profile_id())
);
create policy offer_counterparty_insert on public.offers for insert to authenticated with check (
  status='PENDING' and (buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id))
);

grant select on public.logistics_quotes, public.recommendations to authenticated;
create policy logistics_listing_party on public.logistics_quotes for select to authenticated using (
  exists (select 1 from public.produce_listings l where l.id=listing_id and l.farmer_profile_id=internal.current_profile_id()) or
  exists (select 1 from public.buyer_demands d where d.id=demand_id and (d.buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(d.fpo_id)))
);
create policy recommendation_owner on public.recommendations for select to authenticated using (farmer_profile_id=internal.current_profile_id());

grant select on public.orders, public.order_status_history, public.order_financial_adjustments, public.payments to authenticated;
create policy order_party_read on public.orders for select to authenticated using (farmer_profile_id=internal.current_profile_id() or buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(fpo_id));
create policy order_history_party on public.order_status_history for select to authenticated using (internal.is_order_party(order_id));
create policy adjustment_party on public.order_financial_adjustments for select to authenticated using (internal.is_order_party(order_id));
create policy payment_party on public.payments for select to authenticated using (internal.is_order_party(order_id));

grant select, insert on public.ratings to authenticated;
create policy rating_party_read on public.ratings for select to authenticated using (rater_profile_id=internal.current_profile_id() or ratee_profile_id=internal.current_profile_id());
create policy rating_completed_party_insert on public.ratings for insert to authenticated with check (
  rater_profile_id=internal.current_profile_id() and exists (
    select 1 from public.orders o where o.id=order_id and o.status='COMPLETED' and
    (o.farmer_profile_id=internal.current_profile_id() or o.buyer_profile_id=internal.current_profile_id() or internal.operates_fpo(o.fpo_id))
  )
);

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notification_recipient_read on public.notifications for select to authenticated using (recipient_profile_id=internal.current_profile_id());
create policy notification_recipient_read_state on public.notifications for update to authenticated using (recipient_profile_id=internal.current_profile_id()) with check (recipient_profile_id=internal.current_profile_id());
grant select, insert, update, delete on public.notification_devices to authenticated;
create policy notification_device_owner on public.notification_devices for all to authenticated using (profile_id=internal.current_profile_id()) with check (profile_id=internal.current_profile_id());

grant select, insert on public.grievances, public.grievance_messages to authenticated;
create policy grievance_parties_read on public.grievances for select to authenticated using (
  complainant_profile_id=internal.current_profile_id() or (order_id is not null and internal.is_order_party(order_id))
);
create policy grievance_self_insert on public.grievances for insert to authenticated with check (complainant_profile_id=internal.current_profile_id() and status='OPEN');
create policy grievance_message_parties_read on public.grievance_messages for select to authenticated using (
  not internal_only and exists (select 1 from public.grievances g where g.id=grievance_id and (g.complainant_profile_id=internal.current_profile_id() or (g.order_id is not null and internal.is_order_party(g.order_id))))
);
create policy grievance_message_party_insert on public.grievance_messages for insert to authenticated with check (
  author_profile_id=internal.current_profile_id() and not internal_only and exists (select 1 from public.grievances g where g.id=grievance_id and g.status in ('OPEN','UNDER_REVIEW') and (g.complainant_profile_id=internal.current_profile_id() or (g.order_id is not null and internal.is_order_party(g.order_id))))
);

-- Sequences are not currently used, but future serial objects must not inherit PUBLIC access.
alter default privileges in schema public revoke all on tables from public, anon;
alter default privileges in schema public revoke all on sequences from public, anon;
alter default privileges in schema internal revoke all on tables from public, anon, authenticated;
alter default privileges in schema internal revoke all on functions from public, anon, authenticated;
