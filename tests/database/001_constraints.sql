-- Prerequisite: all migrations and database/seeds/001_sih_demo.sql applied.
-- Execute as the migration/owner role. The transaction rolls back all test writes.
begin;

do $$ begin
  begin
    insert into public.produce_listings(id,farmer_profile_id,crop_id,quantity,available_quantity,available_from,district,state)
    values (gen_random_uuid(),'20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',10,11,current_date,'Test','Test');
    raise exception 'expected listing quantity constraint failure';
  exception when check_violation then null; end;
end $$;

do $$ begin
  begin
    insert into public.recommendations(id,farmer_profile_id,listing_id,candidate_buyer_profile_id,
      estimated_quantity_kg,estimated_unit_price_per_kg,estimated_gross_selling_value,
      estimated_transportation_cost,estimated_storage_cost,estimated_handling_cost,estimated_other_applicable_cost,
      estimated_total_applicable_cost,estimated_net_farmer_realization,rank,data_mode,source_name,engine_version,calculated_at,expires_at)
    values (gen_random_uuid(),'20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
      1000,32,32000,5500,500,300,200,6400,25600,1,'DEMO','TEST','test',now(),now()+interval '1 hour');
    raise exception 'expected financial formula constraint failure';
  exception when check_violation then null; end;
end $$;

insert into public.orders(id,farmer_profile_id,buyer_profile_id,listing_id,accepted_offer_id,logistics_quote_id,source_recommendation_id,
  snapshot_quantity_kg,snapshot_unit_price_per_kg,snapshot_gross_selling_value,snapshot_transportation_cost,snapshot_storage_cost,
  snapshot_handling_cost,snapshot_other_applicable_cost,snapshot_total_applicable_cost,snapshot_net_farmer_realization,
  snapshot_calculation_version,snapshot_calculated_at,farmer_display_name_snapshot,counterparty_display_name_snapshot,accepted_at)
values ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000001','41500000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002',
  1000,31,31000,1500,300,300,150,2250,28750,'demo-v1','2026-09-03 09:00:00+05:30','Rahul','Buyer B','2026-09-03 09:05:00+05:30');

do $$ begin
  begin
    update public.orders set snapshot_net_farmer_realization=1 where id='50000000-0000-4000-8000-000000000001';
    raise exception 'expected immutable snapshot failure';
  exception when object_not_in_prerequisite_state then null; end;
end $$;

do $$ begin
  begin
    update public.orders set status='DELIVERED' where id='50000000-0000-4000-8000-000000000001';
    raise exception 'expected invalid transition failure';
  exception when check_violation then null; end;
end $$;

do $$ begin
  begin
    insert into public.ratings(order_id,rater_profile_id,ratee_profile_id,score)
    values ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003',6);
    raise exception 'expected rating range failure';
  exception when check_violation then null; end;
end $$;

insert into internal.idempotency_records(actor_profile_id,operation_type,idempotency_key,expires_at)
values ('20000000-0000-4000-8000-000000000001','ACCEPT_OFFER','duplicate-test',now()+interval '1 hour');
do $$ begin
  begin
    insert into internal.idempotency_records(actor_profile_id,operation_type,idempotency_key,expires_at)
    values ('20000000-0000-4000-8000-000000000001','ACCEPT_OFFER','duplicate-test',now()+interval '1 hour');
    raise exception 'expected duplicate idempotency failure';
  exception when unique_violation then null; end;
end $$;

do $$ declare a numeric; b numeric; begin
  select estimated_net_farmer_realization into a from public.recommendations where id='43000000-0000-4000-8000-000000000001';
  select estimated_net_farmer_realization into b from public.recommendations where id='43000000-0000-4000-8000-000000000002';
  if a <> 25500 or b <> 28750 or b-a <> 3250 then raise exception 'demo NFR mismatch: %, %',a,b; end if;
end $$;

rollback;

