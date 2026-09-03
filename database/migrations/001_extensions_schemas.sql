-- Phase 2A foundation. Rollback: drop schema internal cascade; drop extension pgcrypto.
create extension if not exists pgcrypto;

create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

