-- Rollback: drop tables in reverse declaration order.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null,
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  phone text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en','hi','bn')),
  status public.account_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farmer_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  farm_summary text,
  district text,
  state text,
  postal_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buyer_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_name text,
  trade_reference text,
  verification_status public.verification_status not null default 'UNVERIFIED',
  reliability_status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fpos (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  registration_reference text unique,
  contact_phone text,
  district text,
  state text,
  verification_status public.verification_status not null default 'UNVERIFIED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fpo_members (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpos(id) on delete restrict,
  farmer_profile_id uuid not null references public.farmer_profiles(profile_id) on delete restrict,
  membership_role text not null default 'MEMBER',
  status public.membership_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fpo_id, farmer_profile_id)
);

create table public.fpo_operators (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpos(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  operator_role text not null default 'OPERATOR',
  status public.membership_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fpo_id, profile_id)
);

