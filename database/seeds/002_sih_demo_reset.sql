-- Reset only the deterministic SIH transaction fixture after 001_sih_demo.sql.
-- Both guards are mandatory; use only in a dedicated local/demo Supabase project.
--
--   SET app.demo_seed_enabled = 'on';
--   SET app.demo_reset_enabled = 'on';
--   \ir database/seeds/002_sih_demo_reset.sql

do $$
begin
  if coalesce(current_setting('app.demo_seed_enabled',true),'off')<>'on'
     or coalesce(current_setting('app.demo_reset_enabled',true),'off')<>'on' then
    raise exception 'Demo reset refused: explicitly enable both demo guards';
  end if;
end $$;

select internal.reset_sih_demo();
