create table internal.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_kind text not null default 'USER',
  action text not null,
  resource_type text not null,
  resource_id uuid,
  correlation_id uuid,
  outcome text not null,
  reason_code text,
  safe_change_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table internal.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete restrict,
  service_scope text,
  operation_type text not null,
  idempotency_key text not null,
  request_fingerprint text,
  resource_type text,
  resource_id uuid,
  response_metadata jsonb,
  status public.idempotency_status not null default 'IN_PROGRESS',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check ((actor_profile_id is not null)::integer + (service_scope is not null)::integer = 1),
  unique nulls not distinct (actor_profile_id, service_scope, operation_type, idempotency_key)
);

revoke all on internal.audit_events, internal.idempotency_records from public, anon, authenticated;
