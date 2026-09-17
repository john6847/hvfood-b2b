-- Local development fixtures. Applied by `supabase db reset` only.
-- Never run against production. Every value here is illustrative.
--
-- Sign in locally with any of these accounts (password: Wholesale-Dev-2026):
--   alex.morgan@horizonvertfoods.test   staff, ADMINISTRATOR (enroll MFA on first admin visit)
--   ops@horizonvertfoods.test           staff, OPERATIONS
--   jean@jeansmarket.test               owner, Jean's Market (APPROVED)
--   marie@jeansmarket.test              buyer, Jean's Market (APPROVED)
--   nadia@caribbeantable.test           owner, Caribbean Table (APPROVED)
--   palm@palmgrove.test                 owner, Palm Grove Market (PENDING)
--   island@islandprovisions.test        owner, Island Provisions (SUSPENDED)

create or replace function pg_temp.seed_user(
  p_email text,
  p_first text,
  p_last text
) returns uuid
language plpgsql
as $$
declare
  uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    p_email, extensions.crypt('Wholesale-Dev-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', p_first, 'last_name', p_last),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
  return uid;
end;
$$;

do $$
declare
  u_alex uuid := pg_temp.seed_user('alex.morgan@horizonvertfoods.test', 'Alex', 'Morgan');
  u_ops uuid := pg_temp.seed_user('ops@horizonvertfoods.test', 'Sam', 'Rivera');
  u_jean uuid := pg_temp.seed_user('jean@jeansmarket.test', 'Jean', 'Martin');
  u_marie uuid := pg_temp.seed_user('marie@jeansmarket.test', 'Marie', 'Louis');
  u_nadia uuid := pg_temp.seed_user('nadia@caribbeantable.test', 'Nadia', 'Pierre');
  u_palm uuid := pg_temp.seed_user('palm@palmgrove.test', 'Rose', 'Baptiste');
  u_island uuid := pg_temp.seed_user('island@islandprovisions.test', 'Marc', 'Charles');
  tier_standard uuid := (select id from public.pricing_tiers where code = 'STANDARD');
  tier_silver uuid := (select id from public.pricing_tiers where code = 'SILVER');
  c_jeans uuid;
  c_carib uuid;
  c_palm uuid;
  c_island uuid;
  a_jeans_bill uuid;
  a_jeans_ship uuid;
  a_carib uuid;
begin
  -- Staff
  insert into public.staff_users (user_id, role_id)
  values
    (u_alex, (select id from public.staff_roles where code = 'ADMINISTRATOR')),
    (u_ops, (select id from public.staff_roles where code = 'OPERATIONS'));

  -- Companies
  insert into public.companies (legal_name, display_name, email, phone, website, status, pricing_tier_id)
  values ('Jean''s Market LLC', 'Jean''s Market', 'orders@jeansmarket.test', '305-555-0142', 'https://jeansmarket.test', 'APPROVED', tier_silver)
  returning id into c_jeans;

  insert into public.companies (legal_name, display_name, email, phone, status, pricing_tier_id)
  values ('Caribbean Table Inc.', 'Caribbean Table', 'purchasing@caribbeantable.test', '407-555-0177', 'APPROVED', tier_standard)
  returning id into c_carib;

  insert into public.companies (legal_name, display_name, email, status)
  values ('Palm Grove Market LLC', 'Palm Grove Market', 'hello@palmgrove.test', 'PENDING')
  returning id into c_palm;

  insert into public.companies (legal_name, display_name, email, status, pricing_tier_id)
  values ('Island Provisions Co.', 'Island Provisions', 'buyer@islandprovisions.test', 'SUSPENDED', tier_standard)
  returning id into c_island;

  -- Memberships
  insert into public.company_users (company_id, user_id, role) values
    (c_jeans, u_jean, 'OWNER'),
    (c_jeans, u_marie, 'BUYER'),
    (c_carib, u_nadia, 'OWNER'),
    (c_palm, u_palm, 'OWNER'),
    (c_island, u_island, 'OWNER');

  -- Private details and commerce policies (staff-only data)
  insert into public.company_private_details (company_id, business_number, internal_notes) values
    (c_jeans, 'FL-SAMPLE-0001', 'Sample account. Long-standing customer in the design fixtures.'),
    (c_carib, 'FL-SAMPLE-0002', 'Sample account.'),
    (c_island, 'GA-SAMPLE-0003', 'Suspended in fixtures to exercise the suspended-account screens.');

  insert into public.company_commerce_policies (company_id, allow_card, allow_ach, order_minimum_minor) values
    (c_jeans, true, true, 25000),
    (c_carib, true, false, 25000),
    (c_island, true, false, 25000);

  -- Addresses and delivery locations
  insert into public.company_addresses (company_id, label, contact_name, phone, line1, city, region, postal_code, is_billing, is_default_shipping)
  values (c_jeans, 'Head office', 'Jean Martin', '305-555-0142', '1200 NW 7th Ave', 'Miami', 'FL', '33136', true, false)
  returning id into a_jeans_bill;

  insert into public.company_addresses (company_id, label, contact_name, phone, line1, city, region, postal_code, is_billing, is_default_shipping)
  values (c_jeans, 'Warehouse', 'Marie Louis', '305-555-0199', '4800 NW 37th Ave', 'Miami', 'FL', '33142', false, true)
  returning id into a_jeans_ship;

  insert into public.company_addresses (company_id, label, contact_name, phone, line1, city, region, postal_code, is_billing, is_default_shipping)
  values (c_carib, 'Restaurant', 'Nadia Pierre', '407-555-0177', '55 W Church St', 'Orlando', 'FL', '32801', true, true)
  returning id into a_carib;

  insert into public.company_locations (company_id, address_id, name, has_dock, liftgate_required, receiving_instructions) values
    (c_jeans, a_jeans_ship, 'Miami warehouse', true, false, 'Receiving Mon-Fri 7am-2pm. Dock 3.'),
    (c_carib, a_carib, 'Downtown restaurant', false, true, 'Rear entrance on Pine St. Call ahead.');
end;
$$;

drop function pg_temp.seed_user(text, text, text);
