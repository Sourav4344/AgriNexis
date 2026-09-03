-- Rollback: drop price_history, mandi_prices, mandis, crop_varieties, crops.
create table public.crops (
  id uuid primary key default gen_random_uuid(),
  canonical_code text not null unique,
  name_en text not null,
  name_hi text,
  name_bn text,
  default_unit text not null default 'kg',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crop_varieties (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete restrict,
  canonical_name text not null,
  name_en text not null,
  name_hi text,
  name_bn text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (crop_id, canonical_name)
);

create table public.mandis (
  id uuid primary key default gen_random_uuid(),
  provider_name text,
  external_id text,
  name text not null,
  district text,
  state text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.mandi_prices (
  id uuid primary key default gen_random_uuid(),
  mandi_id uuid not null references public.mandis(id) on delete restrict,
  crop_id uuid not null references public.crops(id) on delete restrict,
  variety_id uuid references public.crop_varieties(id) on delete restrict,
  min_price numeric(14,2) not null check (min_price >= 0),
  modal_price numeric(14,2) not null check (modal_price >= 0),
  max_price numeric(14,2) not null check (max_price >= 0),
  normalized_unit text not null default 'kg',
  currency char(3) not null default 'INR',
  arrival_quantity numeric(14,3) check (arrival_quantity is null or arrival_quantity >= 0),
  observed_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  source_name text not null,
  source_id text,
  provenance jsonb not null default '{}'::jsonb,
  data_mode public.data_mode not null,
  dataset_id text,
  source_version text,
  checksum text,
  quality_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (min_price <= modal_price and modal_price <= max_price),
  unique nulls not distinct (source_name, source_id, mandi_id, crop_id, variety_id, observed_at)
);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  source_observation_id uuid not null references public.mandi_prices(id) on delete restrict,
  mandi_id uuid not null references public.mandis(id) on delete restrict,
  crop_id uuid not null references public.crops(id) on delete restrict,
  variety_id uuid references public.crop_varieties(id) on delete restrict,
  price_date date not null,
  modal_price numeric(14,2) not null check (modal_price >= 0),
  currency char(3) not null default 'INR',
  transformation_version text not null,
  data_mode public.data_mode not null,
  dataset_id text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_observation_id, transformation_version)
);
