create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'INR',
  provider text,
  provider_reference text,
  method text,
  mode public.payment_mode not null default 'LIVE',
  status public.payment_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  rater_profile_id uuid not null references public.profiles(id) on delete restrict,
  ratee_profile_id uuid references public.profiles(id) on delete restrict,
  ratee_fpo_id uuid references public.fpos(id) on delete restrict,
  dimension text not null default 'OVERALL',
  score smallint not null check (score between 1 and 5),
  comment text,
  moderation_status public.rating_moderation_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((ratee_profile_id is not null)::integer + (ratee_fpo_id is not null)::integer = 1),
  unique (order_id, rater_profile_id, dimension)
);
