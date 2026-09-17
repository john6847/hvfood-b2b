-- Staff projection functions refuse customers and staff without MFA.

begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

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

create function pg_temp.act_as_postgres() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end $$;

create temp table fx (key text primary key, id uuid);
insert into fx values
  ('customer', pg_temp.make_user('customer@projection.test')),
  ('admin', pg_temp.make_user('admin@projection.test')),
  ('catalog', pg_temp.make_user('catalog@projection.test'));

insert into public.companies (id, legal_name, display_name, email, status, pricing_tier_id)
values ('dddddddd-0000-0000-0000-000000000004', 'Projection LLC', 'Projection', 'p@projection.test', 'APPROVED',
  (select id from public.pricing_tiers where code = 'GOLD'));

insert into public.company_users (company_id, user_id, role)
values ('dddddddd-0000-0000-0000-000000000004', (select id from fx where key = 'customer'), 'OWNER');

insert into public.staff_users (user_id, role_id) values
  ((select id from fx where key = 'admin'), (select id from public.staff_roles where code = 'ADMINISTRATOR')),
  ((select id from fx where key = 'catalog'), (select id from public.staff_roles where code = 'CATALOG_MANAGER'));

-- Customer (even a company owner) is refused.
select pg_temp.act_as((select id from fx where key = 'customer'), 'aal2');
select throws_ok($$ select * from public.admin_companies() $$, '42501', null,
  'customers cannot call admin_companies');
select throws_ok($$ select * from public.admin_staff_directory() $$, '42501', null,
  'customers cannot call admin_staff_directory');

-- Administrator without MFA is refused.
select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'admin'), 'aal1');
select throws_ok($$ select * from public.admin_companies() $$, '42501', null,
  'administrator at aal1 cannot call admin_companies');

-- Administrator with MFA sees the tier assignment.
select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'admin'), 'aal2');
select is(
  (select pricing_tier_code from public.admin_companies() where id = 'dddddddd-0000-0000-0000-000000000004'),
  'GOLD', 'administrator sees the pricing tier through the projection');
select is(
  (select member_count from public.admin_companies() where id = 'dddddddd-0000-0000-0000-000000000004'),
  1::bigint, 'projection counts active members');
select ok(
  (select count(*) from public.admin_staff_directory()) >= 2,
  'administrator reads the staff directory');

-- Catalog manager has accounts.read but not staff.manage.
select pg_temp.act_as_postgres();
select pg_temp.act_as((select id from fx where key = 'catalog'), 'aal2');
select throws_ok($$ select * from public.admin_staff_directory() $$, '42501', null,
  'catalog manager cannot read the staff directory');

select * from finish();
rollback;
