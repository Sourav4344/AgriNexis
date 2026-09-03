create index profiles_role_status_idx on public.profiles(role, status);
create index fpo_members_farmer_idx on public.fpo_members(farmer_profile_id, status);
create index fpo_operators_profile_idx on public.fpo_operators(profile_id, status);
create index crop_varieties_crop_idx on public.crop_varieties(crop_id);
create index mandi_prices_crop_variety_observed_idx on public.mandi_prices(crop_id, variety_id, observed_at desc);
create index mandi_prices_mandi_observed_idx on public.mandi_prices(mandi_id, observed_at desc);
create index price_history_crop_date_idx on public.price_history(crop_id, variety_id, price_date desc);
create index listings_owner_idx on public.produce_listings(farmer_profile_id, created_at desc);
create index listings_discovery_idx on public.produce_listings(crop_id, status, state, district) where deleted_at is null;
create index quality_reports_listing_idx on public.quality_reports(listing_id, created_at desc);
create index buyer_demands_buyer_idx on public.buyer_demands(buyer_profile_id, status);
create index buyer_demands_fpo_idx on public.buyer_demands(fpo_id, status);
create index buyer_demands_discovery_idx on public.buyer_demands(crop_id, status, delivery_state);
create index offers_listing_idx on public.offers(listing_id, status);
create index offers_buyer_idx on public.offers(buyer_profile_id, status);
create index offers_fpo_idx on public.offers(fpo_id, status);
create index offers_demand_idx on public.offers(demand_id);
create unique index offers_idempotency_idx on public.offers(
  coalesce(buyer_profile_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(fpo_id, '00000000-0000-0000-0000-000000000000'::uuid), idempotency_key
) where idempotency_key is not null;
create index logistics_quotes_listing_idx on public.logistics_quotes(listing_id, expires_at desc);
create index recommendations_listing_idx on public.recommendations(listing_id, calculated_at desc);
create index orders_farmer_idx on public.orders(farmer_profile_id, status, created_at desc);
create index orders_buyer_idx on public.orders(buyer_profile_id, status, created_at desc);
create index orders_fpo_idx on public.orders(fpo_id, status, created_at desc);
create index order_history_order_idx on public.order_status_history(order_id, changed_at);
create index adjustments_order_idx on public.order_financial_adjustments(order_id, status);
create index payments_order_idx on public.payments(order_id, status);
create unique index payments_provider_reference_idx on public.payments(provider, provider_reference) where provider_reference is not null;
create index ratings_ratee_profile_idx on public.ratings(ratee_profile_id, moderation_status);
create index notifications_unread_idx on public.notifications(recipient_profile_id, created_at desc) where read_at is null;
create index notification_devices_profile_idx on public.notification_devices(profile_id, enabled);
create index grievances_order_status_idx on public.grievances(order_id, status);
create index grievances_complainant_idx on public.grievances(complainant_profile_id, created_at desc);
create index grievance_messages_grievance_idx on public.grievance_messages(grievance_id, created_at);
create index audit_resource_idx on internal.audit_events(resource_type, resource_id, occurred_at desc);
create index idempotency_expiry_idx on internal.idempotency_records(expires_at);
