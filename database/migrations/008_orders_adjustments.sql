create table public.orders (
  id uuid primary key default gen_random_uuid(),
  farmer_profile_id uuid not null references public.farmer_profiles(profile_id) on delete restrict,
  buyer_profile_id uuid references public.buyer_profiles(profile_id) on delete restrict,
  fpo_id uuid references public.fpos(id) on delete restrict,
  listing_id uuid not null references public.produce_listings(id) on delete restrict,
  accepted_offer_id uuid not null unique references public.offers(id) on delete restrict,
  logistics_quote_id uuid references public.logistics_quotes(id) on delete set null,
  source_recommendation_id uuid references public.recommendations(id) on delete set null,
  snapshot_currency char(3) not null default 'INR',
  snapshot_quantity_kg numeric(14,3) not null check (snapshot_quantity_kg > 0),
  snapshot_unit_price_per_kg numeric(14,2) not null check (snapshot_unit_price_per_kg >= 0),
  snapshot_gross_selling_value numeric(14,2) not null check (snapshot_gross_selling_value >= 0),
  snapshot_transportation_cost numeric(14,2) not null default 0 check (snapshot_transportation_cost >= 0),
  snapshot_storage_cost numeric(14,2) not null default 0 check (snapshot_storage_cost >= 0),
  snapshot_handling_cost numeric(14,2) not null default 0 check (snapshot_handling_cost >= 0),
  snapshot_other_applicable_cost numeric(14,2) not null default 0 check (snapshot_other_applicable_cost >= 0),
  snapshot_total_applicable_cost numeric(14,2) not null check (snapshot_total_applicable_cost >= 0),
  snapshot_net_farmer_realization numeric(14,2) not null,
  snapshot_calculation_version text not null,
  snapshot_calculated_at timestamptz not null,
  farmer_display_name_snapshot text not null,
  counterparty_display_name_snapshot text not null,
  status public.order_status not null default 'CONFIRMED',
  version integer not null default 1 check (version > 0),
  accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((buyer_profile_id is not null)::integer + (fpo_id is not null)::integer = 1),
  check (snapshot_gross_selling_value = round(snapshot_quantity_kg * snapshot_unit_price_per_kg, 2)),
  check (snapshot_total_applicable_cost = snapshot_transportation_cost + snapshot_storage_cost + snapshot_handling_cost + snapshot_other_applicable_cost),
  check (snapshot_net_farmer_realization = snapshot_gross_selling_value - snapshot_total_applicable_cost)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  previous_status public.order_status,
  new_status public.order_status not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create table public.order_financial_adjustments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  adjustment_type text not null,
  amount numeric(14,2) not null check (amount <> 0),
  currency char(3) not null default 'INR',
  reason text not null,
  status public.adjustment_status not null default 'PENDING',
  requested_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  check ((status = 'APPROVED' and approved_by is not null and approved_at is not null) or status <> 'APPROVED')
);
