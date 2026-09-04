-- Trusted payment transition enforcement. Rollback: drop trigger/functions below.

create function internal.valid_payment_transition(
  p_from public.payment_status,
  p_to public.payment_status
) returns boolean
language sql immutable
set search_path = pg_catalog
as $$
select case
  when p_from='PENDING' then p_to in ('PROCESSING','FAILED')
  when p_from='PROCESSING' then p_to in ('PAID','FAILED')
  when p_from='PAID' then p_to='REFUNDED'
  else false
end
$$;

create function internal.enforce_payment_update()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public, internal
as $$
begin
  if row(new.order_id,new.amount,new.currency,new.mode) is distinct from
     row(old.order_id,old.amount,old.currency,old.mode) then
    perform internal.raise_domain_error('PAYMENT_IMMUTABLE_FIELDS',409);
  end if;
  if new.status <> old.status and not internal.valid_payment_transition(old.status,new.status) then
    perform internal.raise_domain_error('PAYMENT_TRANSITION_INVALID',409);
  end if;
  if new.status='PAID' and old.status<>'PAID' then new.paid_at=coalesce(new.paid_at,now()); end if;
  return new;
end $$;

create trigger payments_transition_guard
before update on public.payments
for each row execute function internal.enforce_payment_update();

create function internal.transition_payment(
  p_actor_profile_id uuid,
  p_payment_id uuid,
  p_expected_status public.payment_status,
  p_new_status public.payment_status,
  p_reason text default null
) returns public.payments
language plpgsql security definer
set search_path = pg_catalog, public, internal
as $$
declare
  v_payment public.payments%rowtype;
begin
  if auth.uid() is not null and (p_actor_profile_id is null or internal.current_profile_id() is distinct from p_actor_profile_id) then
    perform internal.raise_domain_error('ACTOR_MISMATCH',403);
  end if;
  select * into v_payment from public.payments where id=p_payment_id for update;
  if not found then perform internal.raise_domain_error('PAYMENT_NOT_FOUND',422); end if;
  if v_payment.status <> p_expected_status then perform internal.raise_domain_error('PAYMENT_STATE_CONFLICT',409); end if;
  if not internal.valid_payment_transition(v_payment.status,p_new_status) then
    perform internal.raise_domain_error('PAYMENT_TRANSITION_INVALID',409);
  end if;
  update public.payments set status=p_new_status where id=p_payment_id returning * into v_payment;
  insert into internal.audit_events(actor_profile_id,actor_kind,action,resource_type,resource_id,outcome,safe_change_metadata)
  values (p_actor_profile_id,case when p_actor_profile_id is null then 'SERVICE' else 'USER' end,
    'TRANSITION_PAYMENT','payment',p_payment_id,'SUCCESS',
    jsonb_build_object('from_status',p_expected_status,'to_status',p_new_status,'reason',p_reason));
  return v_payment;
end $$;

revoke all on function internal.valid_payment_transition(public.payment_status,public.payment_status),
  internal.enforce_payment_update(),
  internal.transition_payment(uuid,uuid,public.payment_status,public.payment_status,text)
  from public, anon, authenticated;
grant execute on function internal.transition_payment(uuid,uuid,public.payment_status,public.payment_status,text) to service_role;
