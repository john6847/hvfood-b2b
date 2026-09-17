-- Phase 1 acceptance: two-company isolation, no anonymous access,
-- staff MFA gating, field-whitelisted owner edits.
-- Runs with `supabase test db` (pgTAP). Everything happens inside one
-- transaction that is rolled back, so fixtures never leak into seed data.

begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

-- Helpers -----------------------------------------------------------------

create function pg_temp.make_user(p_email text) returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email, now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '');
  return uid;
end $$;

create function pg_temp.act_as(p_user uuid, p_aal text default 'aal1') returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.act_as_anon() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.act_as_postgres() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end $$;

-- Fixtures ----------------------------------------------------------------

create temp table fx (key text primary key, id uuid);

insert into fx values
  ('owner_a', pg_temp.make_user('owner-a@isolation.test')),
  ('buyer_a', pg_temp.make_user('buyer-a@isolation.test')),
  ('owner_b', pg_temp.make_user('owner-b@isolation.test')),
  ('owner_c', pg_temp.make_user('owner-c@isolation.test')),
  ('outsider', pg_temp.make_user('outsider@isolation.test')),
  ('staff_admin', pg_temp.make_user('staff-admin@isolation.test')),
  ('staff_ops', pg_temp.make_user('staff-ops@isolation.test'));

insert into public.companies (id, legal_name, display_name, email, status)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Company A LLC', 'Company A', 'a@isolation.test', 'APPROVED'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Company B LLC', 'Company B', 'b@isolation.test', 'APPROVED'),
  ('cccccccc-0000-0000-0000-000000000003', 'Company C LLC', 'Company C', 'c@isolation.test', 'SUSPENDED');

insert into public.company_users (company_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', (select id from fx where key = 'owner_a'), 'OWNER'),
  ('aaaaaaaa-0000-0000-0000-000000000001', (select id from fx where key = 'buyer_a'), 'BUYER'),
  ('bbbbbbbb-0000-0000-0000-000000000002', (select id from fx where key = 'owner_b'), 'OWNER'),
  ('cccccccc-0000-0000-0000-000000000003', (select id from fx where key = 'owner_c'), 'OWNER');

insert into public.company_private_details (company_id, internal_notes) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'secret note A'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'secret note B');

insert into public.company_addresses (company_id, label, contact_name, line1, city, region, postal_code, is_billing)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'B office', 'B Owner', '1 B St', 'Atlanta', 'GA', '30301', true);

insert into public.staff_users (user_id, role_id) values
  ((select id from fx where key = 'staff_admin'), (select id from public.staff_roles where code = 'ADMINISTRATOR')),
  ((select id from fx where key = 'staff_ops'), (select id from public.staff_roles where code = 'OPERATIONS'));

-- Anonymous: no grants at all ---------------------------------------------

select pg_temp.act_as_anon();
select throws_ok(
  $$ select count(*) from public.companies $$, '42501',
  null, 'anon cannot read companies');
select throws_ok(
  $$ select count(*) from public.profiles $$, '42501',
  null, 'anon cannot read profiles');
select throws_ok(
  $$ select count(*) from public.pricing_tiers $$, '42501',
  null, 'anon cannot read pricing tiers');
select throws_ok(
  $$ select public.bootstrap_administrator('x@y.test') $$, '42501',
  null, 'anon cannot call bootstrap_administrator');

-- Owner of A ---------------------------------------------------------------

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'owner_a'));

select results_eq(
  $$ select display_name from public.companies order by display_name $$,
  $$ values ('Company A') $$,
  'owner A sees only company A');

select is(
  (select count(*) from public.current_memberships()), 1::bigint,
  'owner A has exactly one membership');

select lives_ok(
  $$ update public.companies set display_name = 'Company A (renamed)'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'owner A can edit safe company fields');

select is(
  (select display_name from public.companies where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Company A (renamed)', 'owner A rename persisted');

select throws_ok(
  $$ update public.companies set status = 'SUSPENDED'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'owner A cannot change company status (column not granted)');

select throws_ok(
  $$ select pricing_tier_id from public.companies $$,
  '42501', null, 'customers cannot read pricing_tier_id');

-- Cross-company update is silently filtered by RLS: zero rows affected.
update public.companies set display_name = 'hacked'
  where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select pg_temp.act_as_postgres();
select is(
  (select display_name from public.companies where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  'Company B', 'owner A cannot rename company B');
select pg_temp.act_as((select id from fx where key = 'owner_a'));

select is(
  (select count(*) from public.company_private_details), 0::bigint,
  'owner A cannot read any private details');

select is(
  (select count(*) from public.pricing_tiers), 0::bigint,
  'owner A cannot read pricing tiers');

select is(
  (select count(*) from public.company_addresses), 0::bigint,
  'owner A cannot see company B addresses');

select lives_ok(
  $$ insert into public.company_addresses (company_id, label, contact_name, line1, city, region, postal_code)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'A office', 'A Owner', '1 A St', 'Miami', 'FL', '33101') $$,
  'owner A can add an address to company A');

select throws_ok(
  $$ insert into public.company_addresses (company_id, label, contact_name, line1, city, region, postal_code)
     values ('bbbbbbbb-0000-0000-0000-000000000002', 'forged', 'X', '1 X St', 'Miami', 'FL', '33101') $$,
  '42501', null, 'owner A cannot add an address to company B (forged company id)');

select is(
  (select count(*) from public.company_users), 2::bigint,
  'owner A sees both memberships of company A and none of B');

select results_eq(
  $$ select email from public.profiles order by email $$,
  $$ values ('buyer-a@isolation.test'), ('owner-a@isolation.test') $$,
  'owner A sees own profile and company A members only');

select is(
  (select count(*) from public.staff_users), 0::bigint,
  'owner A sees no staff records');

-- Buyer of A ---------------------------------------------------------------

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'buyer_a'));

select is(
  (select count(*) from public.companies), 1::bigint,
  'buyer A sees company A');

select throws_ok(
  $$ insert into public.company_addresses (company_id, label, contact_name, line1, city, region, postal_code)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'buyer added', 'X', '1 X St', 'Miami', 'FL', '33101') $$,
  '42501', null, 'buyer cannot add addresses (owner only)');

-- The buyer's own update of company fields is filtered by RLS, not an error.
update public.companies set display_name = 'buyer rename'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select display_name from public.companies where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Company A (renamed)', 'buyer cannot edit company details');

select is(
  (select count(*) from public.company_users), 1::bigint,
  'buyer sees only their own membership');

select is(
  (select count(*) from public.profiles), 1::bigint,
  'buyer sees only their own profile');

-- Suspended company owner --------------------------------------------------

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'owner_c'));

select results_eq(
  $$ select status from public.companies $$,
  $$ values ('SUSPENDED') $$,
  'suspended owner still sees own company with SUSPENDED status');

select is(
  private.is_approved_member('cccccccc-0000-0000-0000-000000000003'), false,
  'suspended company is not an approved membership');

-- Outsider with no memberships --------------------------------------------

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'outsider'));

select is((select count(*) from public.companies), 0::bigint, 'outsider sees no companies');
select is((select count(*) from public.current_memberships()), 0::bigint, 'outsider has no memberships');

-- Staff without MFA, with the MFA switch forced on for this transaction ----

select pg_temp.act_as_postgres();
create or replace function private.staff_mfa_required() returns boolean
  language sql immutable set search_path = '' as $$ select true $$;
select pg_temp.act_as((select id from fx where key = 'staff_admin'), 'aal1');

select is((select count(*) from public.companies), 0::bigint,
  'administrator at aal1 sees no companies when MFA is required');
select is((select mfa_verified from public.current_staff_context()), false,
  'staff context reports MFA not verified at aal1');

-- Switch off (the current default): aal1 is enough.
select pg_temp.act_as_postgres();
create or replace function private.staff_mfa_required() returns boolean
  language sql immutable set search_path = '' as $$ select false $$;
select pg_temp.act_as((select id from fx where key = 'staff_admin'), 'aal1');
select ok((select count(*) from public.companies) >= 3,
  'administrator at aal1 sees companies when MFA is not required');

-- Staff with MFA -----------------------------------------------------------

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'staff_admin'), 'aal2');

select is(
  (select count(*) from public.companies where id in (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000003')), 3::bigint,
  'administrator at aal2 sees every fixture company');
select is(
  (select count(*) from public.company_private_details where company_id in (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002')), 2::bigint,
  'administrator reads private details');
select throws_ok(
  $$ update public.companies set status = 'APPROVED' where id = 'cccccccc-0000-0000-0000-000000000003' $$,
  '42501', null, 'even staff cannot change status through the session client');

select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'staff_ops'), 'aal2');
select is(
  (select 'staff.manage' = any(permissions) from public.current_staff_context()), false,
  'operations role lacks staff.manage');
select is((select count(*) from public.staff_roles), 0::bigint,
  'operations role cannot read staff role configuration');

-- Last owner protection ----------------------------------------------------

select pg_temp.act_as_postgres();
select throws_ok(
  $$ update public.company_users set active = false
     where company_id = 'bbbbbbbb-0000-0000-0000-000000000002' and role = 'OWNER' $$,
  '23514', null, 'the last active owner cannot be deactivated');

select * from finish();
rollback;
