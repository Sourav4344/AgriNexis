-- Prerequisite: migrated database, demo Auth identities, and demo seed.
-- Execute as a role able to SET ROLE authenticated. Each assertion expects zero rows or denial.
begin;
set local role authenticated;

-- Rahul cannot update another farmer's row (none should be affected).
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ declare n integer; begin
  update public.buyer_demands set indicative_price=99 where buyer_profile_id='20000000-0000-4000-8000-000000000002';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'farmer modified buyer demand'; end if;
end $$;

-- Rahul is an FPO member but not an operator; membership cannot create FPO demand.
do $$ begin
  begin
    insert into public.buyer_demands(fpo_id,crop_id,minimum_quantity,maximum_quantity,delivery_from,delivery_until,delivery_state)
    values ('25000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,1,current_date,current_date,'Maharashtra');
    raise exception 'FPO member acted as operator';
  exception when insufficient_privilege then null; end;
end $$;

-- Buyer A cannot see Buyer B's private offer.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ begin
  if exists (select 1 from public.offers where id='41500000-0000-4000-8000-000000000002') then raise exception 'competing offer leaked'; end if;
end $$;

-- A client cannot promote itself, update order economics, or mark a payment paid: privileges/policies deny these operations.
do $$ begin
  begin update public.profiles set role='ADMIN' where id='20000000-0000-4000-8000-000000000002'; raise exception 'role escalation succeeded';
  exception when insufficient_privilege then null; end;
  begin update public.orders set snapshot_net_farmer_realization=1 where id=gen_random_uuid(); raise exception 'order financial update privilege exists';
  exception when insufficient_privilege then null; end;
  begin update public.payments set status='PAID' where id=gen_random_uuid(); raise exception 'payment status update privilege exists';
  exception when insufficient_privilege then null; end;
end $$;

-- Buyers may discover the listing but cannot read the isolated precise location.
do $$ begin
  if not exists (select 1 from public.produce_listings where id='40000000-0000-4000-8000-000000000001') then raise exception 'verified buyer cannot discover active listing'; end if;
  if exists (select 1 from public.listing_private_locations where listing_id='40000000-0000-4000-8000-000000000001') then raise exception 'precise location leaked'; end if;
end $$;

-- A suspended user resolves to no active profile and therefore sees no reference data.
reset role;
update public.profiles set status='SUSPENDED' where id='20000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ begin if exists(select 1 from public.crops) then raise exception 'suspended user retained access'; end if; end $$;

reset role;
set local role anon;
do $$ begin
  begin perform 1 from public.profiles limit 1; raise exception 'anonymous private access succeeded';
  exception when insufficient_privilege then null; end;
end $$;

rollback;
