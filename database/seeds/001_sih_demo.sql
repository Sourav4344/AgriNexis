-- Deterministic SIH demo seed. Refuses to run unless explicitly enabled.
-- Usage after migrations and Auth provisioning:
--   set app.demo_seed_enabled = 'on';
--   \ir database/seeds/001_sih_demo.sql
do $$
begin
  if coalesce(current_setting('app.demo_seed_enabled', true), 'off') <> 'on' then
    raise exception 'Demo seed refused: SET app.demo_seed_enabled = on in a dedicated demo environment';
  end if;
  if not exists (select 1 from auth.users where id = '10000000-0000-4000-8000-000000000001'::uuid)
     or not exists (select 1 from auth.users where id = '10000000-0000-4000-8000-000000000002'::uuid)
     or not exists (select 1 from auth.users where id = '10000000-0000-4000-8000-000000000003'::uuid) then
    raise exception 'Provision the documented Rahul, Buyer A, and Buyer B Auth UUIDs before running this seed';
  end if;
end $$;

insert into public.profiles(id,user_id,role,display_name,preferred_locale,status) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','FARMER','Rahul','hi','ACTIVE'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','BUYER','Buyer A','en','ACTIVE'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','BUYER','Buyer B','en','ACTIVE')
on conflict (id) do update set display_name=excluded.display_name, preferred_locale=excluded.preferred_locale, status=excluded.status;

insert into public.farmer_profiles(profile_id,district,state,postal_area,farm_summary) values
('20000000-0000-4000-8000-000000000001','Pune','Maharashtra','DEMO-AREA','DEMO farmer profile')
on conflict (profile_id) do update set district=excluded.district,state=excluded.state,postal_area=excluded.postal_area,farm_summary=excluded.farm_summary;

insert into public.buyer_profiles(profile_id,organization_name,verification_status,reliability_status) values
('20000000-0000-4000-8000-000000000002','DEMO Buyer A','VERIFIED','ACTIVE'),
('20000000-0000-4000-8000-000000000003','DEMO Buyer B','VERIFIED','ACTIVE')
on conflict (profile_id) do update set organization_name=excluded.organization_name,verification_status=excluded.verification_status,reliability_status=excluded.reliability_status;

insert into public.fpos(id,legal_name,display_name,registration_reference,district,state,verification_status) values
('25000000-0000-4000-8000-000000000001','DEMO Farmer Collective','DEMO FPO','DEMO-FPO-001','Pune','Maharashtra','VERIFIED')
on conflict (id) do update set display_name=excluded.display_name,verification_status=excluded.verification_status;

insert into public.fpo_members(id,fpo_id,farmer_profile_id,membership_role,status) values
('26000000-0000-4000-8000-000000000001','25000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','MEMBER','ACTIVE')
on conflict (id) do update set status=excluded.status;

insert into public.crops(id,canonical_code,name_en,name_hi,name_bn,default_unit) values
('30000000-0000-4000-8000-000000000001','TOMATO','Tomato','टमाटर','টমেটো','kg')
on conflict (id) do update set name_en=excluded.name_en,name_hi=excluded.name_hi,name_bn=excluded.name_bn;

insert into public.crop_varieties(id,crop_id,canonical_name,name_en) values
('31000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','DEMO_STANDARD','Demo Standard')
on conflict (id) do update set name_en=excluded.name_en;

insert into public.mandis(id,provider_name,external_id,name,district,state) values
('32000000-0000-4000-8000-000000000001','AGRINEXIS_DEMO','PUNE_DEMO','DEMO Pune Mandi','Pune','Maharashtra')
on conflict (id) do update set name=excluded.name,district=excluded.district,state=excluded.state;

insert into public.mandi_prices(id,mandi_id,crop_id,variety_id,min_price,modal_price,max_price,observed_at,fetched_at,source_name,source_id,provenance,data_mode,dataset_id,source_version,checksum) values
('33000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',28,30,33,'2026-09-01 09:00:00+05:30','2026-09-01 09:05:00+05:30','AGRINEXIS_DEMO','PRICE-1','{"label":"DEMO DATA — NOT LIVE GOVERNMENT DATA"}','DEMO','SIH-2026-TOMATO-V1','1.0','demo-price-1'),
('33000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',29,31,34,'2026-09-02 09:00:00+05:30','2026-09-02 09:05:00+05:30','AGRINEXIS_DEMO','PRICE-2','{"label":"DEMO DATA — NOT LIVE GOVERNMENT DATA"}','DEMO','SIH-2026-TOMATO-V1','1.0','demo-price-2')
on conflict (id) do nothing;

insert into public.price_history(id,source_observation_id,mandi_id,crop_id,variety_id,price_date,modal_price,transformation_version,data_mode,dataset_id,provenance) values
('34000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','2026-09-01',30,'demo-v1','DEMO','SIH-2026-TOMATO-V1','{"label":"DEMO DATA — NOT LIVE GOVERNMENT DATA"}'),
('34000000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','2026-09-02',31,'demo-v1','DEMO','SIH-2026-TOMATO-V1','{"label":"DEMO DATA — NOT LIVE GOVERNMENT DATA"}')
on conflict (id) do nothing;

insert into public.produce_listings(id,farmer_profile_id,crop_id,variety_id,quantity,available_quantity,unit,harvest_date,available_from,available_until,district,state,postal_area,quality_summary,status) values
('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',1000,1000,'kg','2026-09-01','2026-09-03','2026-09-06','Pune','Maharashtra','DEMO-AREA','{"declared_grade":"A","demo_label":"DEMO DATA"}','ACTIVE')
on conflict (id) do update set available_quantity=excluded.available_quantity,status=excluded.status,quality_summary=excluded.quality_summary;

insert into public.buyer_demands(id,buyer_profile_id,crop_id,variety_id,minimum_quantity,maximum_quantity,unit,delivery_from,delivery_until,delivery_district,delivery_state,indicative_price,status) values
('41000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',1000,1000,'kg','2026-09-03','2026-09-06','Mumbai','Maharashtra',32,'ACTIVE'),
('41000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',1000,1000,'kg','2026-09-03','2026-09-06','Pune','Maharashtra',31,'ACTIVE')
on conflict (id) do update set indicative_price=excluded.indicative_price,status=excluded.status;

insert into public.offers(id,listing_id,demand_id,buyer_profile_id,offered_quantity,unit,unit_price,currency,delivery_terms,expires_at,status,idempotency_key) values
('41500000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',1000,'kg',32,'INR','buyer_pickup','2026-09-04 12:00:00+05:30','PENDING','SIH-DEMO-OFFER-A'),
('41500000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003',1000,'kg',31,'INR','buyer_pickup','2026-09-04 12:00:00+05:30','PENDING','SIH-DEMO-OFFER-B')
on conflict (id) do update set unit_price=excluded.unit_price,expires_at=excluded.expires_at,status=excluded.status;

insert into public.logistics_quotes(id,listing_id,demand_id,transportation_cost,storage_cost,handling_cost,other_applicable_cost,total_applicable_cost,distance_km,assumptions,source_name,data_mode,confidence,dataset_id,source_version,checksum,calculated_at,expires_at) values
('42000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',5500,500,300,200,6500,160,'{"method":"DEMO_DISTANCE_SLAB"}','AGRINEXIS_DEMO','DEMO',1,'SIH-2026-TOMATO-V1','1.0','demo-logistics-a','2026-09-03 09:00:00+05:30','2026-09-04 12:00:00+05:30'),
('42000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002',1500,300,300,150,2250,35,'{"method":"DEMO_DISTANCE_SLAB"}','AGRINEXIS_DEMO','DEMO',1,'SIH-2026-TOMATO-V1','1.0','demo-logistics-b','2026-09-03 09:00:00+05:30','2026-09-04 12:00:00+05:30')
on conflict (id) do update set expires_at=excluded.expires_at;

insert into public.recommendations(id,farmer_profile_id,listing_id,candidate_buyer_profile_id,demand_id,logistics_quote_id,estimated_quantity_kg,estimated_unit_price_per_kg,estimated_gross_selling_value,estimated_transportation_cost,estimated_storage_cost,estimated_handling_cost,estimated_other_applicable_cost,estimated_total_applicable_cost,estimated_net_farmer_realization,rank,sell_wait,explanation_facts,confidence,data_mode,source_name,dataset_id,engine_version,input_metadata,calculated_at,expires_at) values
('43000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001',1000,32,32000,5500,500,300,200,6500,25500,2,'SELL_NOW','["DEMO_DATA","HIGHER_HEADLINE_PRICE"]',1,'DEMO','AGRINEXIS_DEMO','SIH-2026-TOMATO-V1','demo-v1','{"frozen_as_of":"2026-09-03T09:00:00+05:30"}','2026-09-03 09:00:00+05:30','2026-09-04 12:00:00+05:30'),
('43000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002',1000,31,31000,1500,300,300,150,2250,28750,1,'SELL_NOW','["DEMO_DATA","LOWER_TOTAL_COST","HIGHER_NET_REALIZATION","CLOSER_BUYER"]',1,'DEMO','AGRINEXIS_DEMO','SIH-2026-TOMATO-V1','demo-v1','{"frozen_as_of":"2026-09-03T09:00:00+05:30"}','2026-09-03 09:00:00+05:30','2026-09-04 12:00:00+05:30')
on conflict (id) do update set rank=excluded.rank,estimated_net_farmer_realization=excluded.estimated_net_farmer_realization,explanation_facts=excluded.explanation_facts;
