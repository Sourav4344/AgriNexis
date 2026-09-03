-- Prerequisite: migrations and guarded demo seed. Execute as migration/owner role.
begin;
do $$ declare first_id uuid; replay_id uuid; remaining numeric; begin
  select internal.accept_offer(
    '20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
    '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002',
    'acceptance-test','sha256:test',31000,2250,28750
  ) into first_id;
  select internal.accept_offer(
    '20000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002',1,1,
    '42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002',
    'acceptance-test','sha256:test',31000,2250,28750
  ) into replay_id;
  if first_id is distinct from replay_id then raise exception 'idempotent replay created a different result'; end if;
  select available_quantity into remaining from public.produce_listings where id='40000000-0000-4000-8000-000000000001';
  if remaining <> 0 then raise exception 'listing quantity was not reserved exactly once: %',remaining; end if;
  if not exists(select 1 from public.orders where id=first_id and snapshot_net_farmer_realization=28750) then
    raise exception 'accepted order snapshot missing or incorrect';
  end if;
end $$;
rollback;

