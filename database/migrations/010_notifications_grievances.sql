create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  channel text not null default 'IN_APP',
  status public.notification_status not null default 'QUEUED',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz
);

create table public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  device_token_hash text not null,
  platform text not null check (platform in ('ANDROID','IOS','WEB')),
  enabled boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, device_token_hash)
);

create table public.grievances (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete restrict,
  prior_grievance_id uuid references public.grievances(id) on delete restrict,
  complainant_profile_id uuid not null references public.profiles(id) on delete restrict,
  category text not null,
  description text not null,
  status public.grievance_status not null default 'OPEN',
  assignee_profile_id uuid references public.profiles(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (prior_grievance_id is null or prior_grievance_id <> id)
);

create table public.grievance_messages (
  id uuid primary key default gen_random_uuid(),
  grievance_id uuid not null references public.grievances(id) on delete restrict,
  author_profile_id uuid references public.profiles(id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  internal_only boolean not null default false,
  created_at timestamptz not null default now()
);

