-- Phase 1 / foundation.
-- Private schema for authorization helpers (not exposed through the API),
-- shared trigger functions and a locked-down default privilege posture.

create schema if not exists private;

-- The API only exposes `public` and `graphql_public`. Keep `private` reachable
-- for policy evaluation by authenticated sessions, but grant nothing else.
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- New functions must be explicitly granted. Supabase's defaults would give
-- EXECUTE to PUBLIC, which we never want for SECURITY DEFINER helpers.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

-- Supabase default privileges grant new public tables to anon/authenticated.
-- Every table migration revokes those grants explicitly and re-grants narrow
-- column lists. This makes the intent visible per table.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Optimistic concurrency: rows with a `version` column bump it on every
-- update so services can detect stale edits.
create or replace function private.bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.version := old.version + 1;
  return new;
end;
$$;

-- Session helpers ---------------------------------------------------------

create or replace function private.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;
grant execute on function private.current_user_id() to authenticated;

-- Staff actions require a session at authenticator assurance level 2 (MFA).
create or replace function private.session_is_mfa_verified()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;
grant execute on function private.session_is_mfa_verified() to authenticated;
