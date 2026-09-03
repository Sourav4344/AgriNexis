-- Precise coordinates are isolated so discovery access cannot reveal them.
create table public.produce_listings (
  id uuid primary key default gen_random_uuid(),
  farmer_profile_id uuid not null references public.farmer_profiles(profile_id) on delete restrict,
  crop_id uuid not null references public.crops(id) on delete restrict,
  variety_id uuid references public.crop_varieties(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  available_quantity numeric(14,3) not null check (available_quantity >= 0 and available_quantity <= quantity),
  unit text not null default 'kg',
  harvest_date date,
  available_from date not null,
  available_until date,
  district text not null,
  state text not null,
  postal_area text,
  quality_summary jsonb not null default '{}'::jsonb,
  status public.listing_status not null default 'DRAFT',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (available_until is null or available_until >= available_from)
);

create table public.listing_private_locations (
  listing_id uuid primary key references public.produce_listings(id) on delete cascade,
  latitude numeric(9,6),
  longitude numeric(9,6),
  address_line text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.quality_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.produce_listings(id) on delete restrict,
  method text not null,
  source_name text not null,
  observations jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  verification_status public.verification_status not null default 'UNVERIFIED',
  manually_verified boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  limitations jsonb not null default '[]'::jsonb,
  model_version text,
  data_mode public.data_mode not null default 'LIVE',
  dataset_id text,
  source_timestamp timestamptz,
  fetched_at timestamptz,
  checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not manually_verified or (verified_by is not null and verified_at is not null))
);

create table public.quality_assets (
  id uuid primary key default gen_random_uuid(),
  quality_report_id uuid not null references public.quality_reports(id) on delete restrict,
  storage_object_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  checksum text not null,
  scan_status text not null default 'PENDING' check (scan_status in ('PENDING','CLEAN','REJECTED')),
  created_at timestamptz not null default now()
);
