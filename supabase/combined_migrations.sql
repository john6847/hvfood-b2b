-- ==============================================================================
-- Horizon Vert Foods Wholesale: Combined Phase 1 Migrations
-- Target: Online Supabase Project (hxxwjjrinbsrekwpshum)
-- Contents:
--   1. Foundation (private schema, triggers, session helpers)
--   2. Identity (profiles, staff roles, permissions, auth trigger)
--   3. Companies (pricing tiers, companies, company users, addresses, locations)
--   4. Policies (RLS policies and column grants)
--   5. Reference Data (permissions, staff roles, pricing tiers)
--   6. Admin Projections (staff RPCs)
--   7. Staff MFA Optional switch
-- ==============================================================================

begin;

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
-- Phase 1 / identity: profiles, staff roles and permissions.
-- Staff permissions and company roles are separate. There is no
-- customer-controlled global role field anywhere.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  locale text not null default 'en-US',
  constraint profiles_email_nonempty check (length(btrim(email)) > 0)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null unique,
  name text not null
);
alter table public.staff_roles enable row level security;
revoke all on public.staff_roles from anon, authenticated;
create trigger staff_roles_set_updated_at
  before update on public.staff_roles
  for each row execute function private.set_updated_at();

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null unique,
  description text not null
);
alter table public.permissions enable row level security;
revoke all on public.permissions from anon, authenticated;
create trigger permissions_set_updated_at
  before update on public.permissions
  for each row execute function private.set_updated_at();

create table public.staff_role_permissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role_id uuid not null references public.staff_roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique (role_id, permission_id)
);
alter table public.staff_role_permissions enable row level security;
revoke all on public.staff_role_permissions from anon, authenticated;
create index staff_role_permissions_permission_id_idx on public.staff_role_permissions (permission_id);
create trigger staff_role_permissions_set_updated_at
  before update on public.staff_role_permissions
  for each row execute function private.set_updated_at();

create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role_id uuid not null references public.staff_roles(id),
  active boolean not null default true
);
alter table public.staff_users enable row level security;
revoke all on public.staff_users from anon, authenticated;
create index staff_users_role_id_idx on public.staff_users (role_id);
create trigger staff_users_set_updated_at
  before update on public.staff_users
  for each row execute function private.set_updated_at();

-- Profile lifecycle --------------------------------------------------------
-- A profile row mirrors every auth user. Names come from invitation metadata
-- when present; nothing in raw_user_meta_data is ever used for authorization.

create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.handle_auth_user_email_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_auth_user_created();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.handle_auth_user_email_changed();

-- Staff authorization helpers ---------------------------------------------
-- SECURITY DEFINER so policies can consult staff tables without recursion.
-- Fixed empty search_path, fully qualified identifiers, minimal returns.

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.session_is_mfa_verified()
    and exists (
      select 1
      from public.staff_users su
      where su.user_id = auth.uid()
        and su.active
    );
$$;
grant execute on function private.is_staff() to authenticated;

create or replace function private.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.session_is_mfa_verified()
    and exists (
      select 1
      from public.staff_users su
      join public.staff_role_permissions srp on srp.role_id = su.role_id
      join public.permissions p on p.id = srp.permission_id
      where su.user_id = auth.uid()
        and su.active
        and p.code = permission_code
    );
$$;
grant execute on function private.has_permission(text) to authenticated;

-- Exposed to the application so the server can render navigation and gate
-- actions. It is a convenience, not the authorization boundary: every table
-- policy and privileged function re-checks on its own.
create or replace function public.current_staff_context()
returns table (
  staff_user_id uuid,
  role_code text,
  role_name text,
  mfa_verified boolean,
  permissions text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    su.id,
    sr.code,
    sr.name,
    private.session_is_mfa_verified(),
    coalesce(
      (
        select array_agg(p.code order by p.code)
        from public.staff_role_permissions srp
        join public.permissions p on p.id = srp.permission_id
        where srp.role_id = su.role_id
      ),
      '{}'::text[]
    )
  from public.staff_users su
  join public.staff_roles sr on sr.id = su.role_id
  where su.user_id = auth.uid()
    and su.active;
$$;
grant execute on function public.current_staff_context() to authenticated;

-- Operator bootstrap -------------------------------------------------------
-- Creating the first administrator is an operator action run with the
-- service role (or psql), never a public signup path. The target user must
-- already exist in auth.users; this only grants the staff role.

create or replace function public.bootstrap_administrator(target_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
  admin_role_id uuid;
  staff_id uuid;
begin
  select id into target_profile_id
  from public.profiles
  where lower(email) = lower(target_email);

  if target_profile_id is null then
    raise exception 'No auth user with email % exists yet', target_email
      using errcode = 'P0002';
  end if;

  select id into admin_role_id from public.staff_roles where code = 'ADMINISTRATOR';
  if admin_role_id is null then
    raise exception 'ADMINISTRATOR role is missing; apply reference data first'
      using errcode = 'P0002';
  end if;

  insert into public.staff_users (user_id, role_id, active)
  values (target_profile_id, admin_role_id, true)
  on conflict (user_id) do update
    set role_id = excluded.role_id, active = true
  returning id into staff_id;

  return staff_id;
end;
$$;
revoke all on function public.bootstrap_administrator(text) from public, anon, authenticated;
grant execute on function public.bootstrap_administrator(text) to service_role;
-- Phase 1 / companies: tiers, companies, memberships, private details,
-- commerce policies, addresses and delivery locations.
-- Applications, invitations and tax exemptions arrive in Phase 2.

create table public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null unique,
  name text not null,
  active boolean not null default true
);
alter table public.pricing_tiers enable row level security;
revoke all on public.pricing_tiers from anon, authenticated;
create trigger pricing_tiers_set_updated_at
  before update on public.pricing_tiers
  for each row execute function private.set_updated_at();

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legal_name text not null,
  display_name text not null,
  email text not null,
  phone text,
  website text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  pricing_tier_id uuid references public.pricing_tiers(id),
  currency text not null default 'USD' check (currency = 'USD'),
  version bigint not null default 1,
  constraint companies_legal_name_nonempty check (length(btrim(legal_name)) > 0),
  constraint companies_display_name_nonempty check (length(btrim(display_name)) > 0),
  constraint companies_email_nonempty check (length(btrim(email)) > 0)
);
alter table public.companies enable row level security;
revoke all on public.companies from anon, authenticated;
create index companies_email_idx on public.companies (lower(email));
create index companies_status_idx on public.companies (status);
create index companies_pricing_tier_id_idx on public.companies (pricing_tier_id);
create trigger companies_bump_version
  before update on public.companies
  for each row execute function private.bump_version();

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id),
  user_id uuid not null references public.profiles(id),
  role text not null check (role in ('OWNER', 'BUYER', 'VIEWER')),
  active boolean not null default true,
  unique (company_id, user_id),
  unique (id, company_id)
);
alter table public.company_users enable row level security;
revoke all on public.company_users from anon, authenticated;
create index company_users_user_id_idx on public.company_users (user_id);
create trigger company_users_set_updated_at
  before update on public.company_users
  for each row execute function private.set_updated_at();

create table public.company_private_details (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null unique references public.companies(id),
  business_number text,
  tax_number text,
  internal_notes text
);
alter table public.company_private_details enable row level security;
revoke all on public.company_private_details from anon, authenticated;
create trigger company_private_details_set_updated_at
  before update on public.company_private_details
  for each row execute function private.set_updated_at();

create table public.company_commerce_policies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null unique references public.companies(id),
  payment_terms_days integer not null default 0 check (payment_terms_days in (0, 15, 30, 45)),
  credit_limit_minor bigint not null default 0 check (credit_limit_minor >= 0),
  order_minimum_minor bigint check (order_minimum_minor >= 0),
  allow_card boolean not null default true,
  allow_ach boolean not null default false,
  allow_manual boolean not null default false,
  allow_terms boolean not null default false,
  release_policy text not null default 'PAYMENT_SUCCEEDED'
    check (release_policy in ('PAYMENT_SUCCEEDED', 'APPROVED_CREDIT')),
  version bigint not null default 1,
  check (not allow_terms or payment_terms_days > 0),
  check (release_policy <> 'APPROVED_CREDIT' or allow_terms)
);
alter table public.company_commerce_policies enable row level security;
revoke all on public.company_commerce_policies from anon, authenticated;
create trigger company_commerce_policies_bump_version
  before update on public.company_commerce_policies
  for each row execute function private.bump_version();

create table public.company_addresses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id),
  label text not null,
  contact_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country_code text not null default 'US' check (country_code = 'US'),
  is_billing boolean not null default false,
  is_default_shipping boolean not null default false,
  archived_at timestamptz,
  unique (id, company_id),
  constraint company_addresses_label_nonempty check (length(btrim(label)) > 0),
  constraint company_addresses_line1_nonempty check (length(btrim(line1)) > 0),
  constraint company_addresses_region_us_state check (region ~ '^[A-Z]{2}$'),
  constraint company_addresses_postal_us_zip check (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$')
);
alter table public.company_addresses enable row level security;
revoke all on public.company_addresses from anon, authenticated;
create index company_addresses_company_id_idx on public.company_addresses (company_id);
create unique index company_addresses_one_billing
  on public.company_addresses (company_id) where is_billing and archived_at is null;
create unique index company_addresses_one_default_shipping
  on public.company_addresses (company_id) where is_default_shipping and archived_at is null;
create trigger company_addresses_set_updated_at
  before update on public.company_addresses
  for each row execute function private.set_updated_at();

create table public.company_locations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id),
  address_id uuid not null,
  name text not null,
  is_residential boolean not null default false,
  has_dock boolean not null default false,
  liftgate_required boolean not null default false,
  appointment_required boolean not null default false,
  receiving_instructions text,
  active boolean not null default true,
  unique (id, company_id),
  -- The address must belong to the same company: composite FK.
  foreign key (address_id, company_id) references public.company_addresses(id, company_id),
  constraint company_locations_name_nonempty check (length(btrim(name)) > 0)
);
alter table public.company_locations enable row level security;
revoke all on public.company_locations from anon, authenticated;
create index company_locations_company_id_idx on public.company_locations (company_id);
create index company_locations_address_id_idx on public.company_locations (address_id);
create trigger company_locations_set_updated_at
  before update on public.company_locations
  for each row execute function private.set_updated_at();

-- Invariant: an active company never loses its last active owner.
create or replace function private.protect_last_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  remaining integer;
  affected_company uuid;
begin
  if tg_op = 'DELETE' then
    affected_company := old.company_id;
  else
    affected_company := old.company_id;
    if new.company_id <> old.company_id then
      raise exception 'Memberships cannot move between companies' using errcode = '23514';
    end if;
  end if;

  if old.role = 'OWNER' and old.active
     and (tg_op = 'DELETE' or new.role <> 'OWNER' or not new.active) then
    select count(*) into remaining
    from public.company_users cu
    where cu.company_id = affected_company
      and cu.role = 'OWNER'
      and cu.active
      and cu.id <> old.id;
    if remaining = 0 then
      raise exception 'A company must keep at least one active owner' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger company_users_protect_last_owner
  before update or delete on public.company_users
  for each row execute function private.protect_last_owner();

-- Membership helpers ------------------------------------------------------

create or replace function private.is_active_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.company_id = target_company_id
      and cu.user_id = auth.uid()
      and cu.active
  );
$$;
grant execute on function private.is_active_member(uuid) to authenticated;

create or replace function private.is_company_owner(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.company_id = target_company_id
      and cu.user_id = auth.uid()
      and cu.active
      and cu.role = 'OWNER'
  );
$$;
grant execute on function private.is_company_owner(uuid) to authenticated;

-- Wholesale access: authenticated, active membership, approved company.
-- Catalog and pricing policies in later phases build on this.
create or replace function private.is_approved_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.companies c on c.id = cu.company_id
    where cu.company_id = target_company_id
      and cu.user_id = auth.uid()
      and cu.active
      and c.status = 'APPROVED'
  );
$$;
grant execute on function private.is_approved_member(uuid) to authenticated;
-- Phase 1 / RLS policies and grants.
-- Default deny. Anonymous sessions get no table grants at all.
-- Column grants are the field whitelist for customer edits; RLS limits rows.
-- Staff status/tier/credit changes are not possible through the session
-- client: they run in server code with the service role after explicit
-- permission checks, or through dedicated SECURITY DEFINER commands.

-- profiles ----------------------------------------------------------------
grant select (id, email, first_name, last_name, phone, locale, created_at, updated_at)
  on public.profiles to authenticated;
grant update (first_name, last_name, phone, locale)
  on public.profiles to authenticated;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- Company owners can see the names of people in their own companies.
create policy profiles_select_company_owner
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.company_users cu
      where cu.user_id = public.profiles.id
        and cu.active
        and private.is_company_owner(cu.company_id)
    )
  );

create policy profiles_select_staff
  on public.profiles for select to authenticated
  using (private.has_permission('accounts.read'));

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- staff tables ------------------------------------------------------------
grant select on public.staff_roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.staff_role_permissions to authenticated;
grant select (id, user_id, role_id, active, created_at, updated_at) on public.staff_users to authenticated;

create policy staff_roles_select_admin
  on public.staff_roles for select to authenticated
  using (private.has_permission('staff.manage'));

create policy permissions_select_admin
  on public.permissions for select to authenticated
  using (private.has_permission('staff.manage'));

create policy staff_role_permissions_select_admin
  on public.staff_role_permissions for select to authenticated
  using (private.has_permission('staff.manage'));

create policy staff_users_select_own
  on public.staff_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy staff_users_select_admin
  on public.staff_users for select to authenticated
  using (private.has_permission('staff.manage'));

-- pricing_tiers -----------------------------------------------------------
grant select on public.pricing_tiers to authenticated;

create policy pricing_tiers_select_staff
  on public.pricing_tiers for select to authenticated
  using (private.has_permission('pricing.read'));

-- companies ---------------------------------------------------------------
-- pricing_tier_id is deliberately absent from the customer column grant.
grant select (id, legal_name, display_name, email, phone, website, status, currency, version, created_at, updated_at)
  on public.companies to authenticated;
grant update (display_name, phone, website, email)
  on public.companies to authenticated;

create policy companies_select_member
  on public.companies for select to authenticated
  using (private.is_active_member(id));

create policy companies_select_staff
  on public.companies for select to authenticated
  using (private.has_permission('accounts.read'));

create policy companies_update_owner
  on public.companies for update to authenticated
  using (private.is_company_owner(id))
  with check (private.is_company_owner(id));

-- company_users -----------------------------------------------------------
grant select on public.company_users to authenticated;

create policy company_users_select_own
  on public.company_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy company_users_select_owner
  on public.company_users for select to authenticated
  using (private.is_company_owner(company_id));

create policy company_users_select_staff
  on public.company_users for select to authenticated
  using (private.has_permission('accounts.read'));

-- company_private_details / company_commerce_policies --------------------
-- Never customer-readable. Staff read through permission only.
grant select on public.company_private_details to authenticated;
grant select on public.company_commerce_policies to authenticated;

create policy company_private_details_select_staff
  on public.company_private_details for select to authenticated
  using (private.has_permission('accounts.read'));

create policy company_commerce_policies_select_staff
  on public.company_commerce_policies for select to authenticated
  using (private.has_permission('finance.read') or private.has_permission('accounts.read'));

-- company_addresses -------------------------------------------------------
grant select on public.company_addresses to authenticated;
grant insert (company_id, label, contact_name, phone, line1, line2, city, region, postal_code, country_code, is_billing, is_default_shipping)
  on public.company_addresses to authenticated;
grant update (label, contact_name, phone, line1, line2, city, region, postal_code, is_billing, is_default_shipping, archived_at)
  on public.company_addresses to authenticated;

create policy company_addresses_select_member
  on public.company_addresses for select to authenticated
  using (private.is_active_member(company_id));

create policy company_addresses_select_staff
  on public.company_addresses for select to authenticated
  using (private.has_permission('accounts.read'));

create policy company_addresses_insert_owner
  on public.company_addresses for insert to authenticated
  with check (private.is_company_owner(company_id));

create policy company_addresses_update_owner
  on public.company_addresses for update to authenticated
  using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

-- company_locations -------------------------------------------------------
grant select on public.company_locations to authenticated;
grant insert (company_id, address_id, name, is_residential, has_dock, liftgate_required, appointment_required, receiving_instructions, active)
  on public.company_locations to authenticated;
grant update (address_id, name, is_residential, has_dock, liftgate_required, appointment_required, receiving_instructions, active)
  on public.company_locations to authenticated;

create policy company_locations_select_member
  on public.company_locations for select to authenticated
  using (private.is_active_member(company_id));

create policy company_locations_select_staff
  on public.company_locations for select to authenticated
  using (private.has_permission('accounts.read'));

create policy company_locations_insert_owner
  on public.company_locations for insert to authenticated
  with check (private.is_company_owner(company_id));

create policy company_locations_update_owner
  on public.company_locations for update to authenticated
  using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

-- Membership summary for the signed-in user ------------------------------
-- One call gives the app every company the person can act in, with the
-- status needed to route pending/suspended accounts to the right screen.
create or replace function public.current_memberships()
returns table (
  membership_id uuid,
  company_id uuid,
  company_display_name text,
  company_status text,
  role text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select cu.id, c.id, c.display_name, c.status, cu.role
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.user_id = (select auth.uid())
    and cu.active
  order by c.display_name;
$$;
grant execute on function public.current_memberships() to authenticated;
-- Phase 1 / reference data required in every environment.
-- Staff roles, permissions and the launch pricing tiers. Idempotent.

insert into public.permissions (code, description) values
  ('accounts.read', 'View companies, memberships, addresses and private company details'),
  ('accounts.manage', 'Edit companies, memberships, addresses, status and tier assignment'),
  ('applications.review', 'Review, approve and reject wholesale applications'),
  ('catalog.read', 'View products, packaging and categories in admin'),
  ('catalog.manage', 'Create and edit products, packaging and categories'),
  ('pricing.read', 'View price lists, tiers, breaks and overrides'),
  ('pricing.manage', 'Edit price lists, tiers, breaks and overrides'),
  ('orders.read', 'View all wholesale orders'),
  ('orders.manage', 'Change order status, notes and holds'),
  ('orders.assist', 'Create carts and orders on behalf of a company'),
  ('fulfillment.manage', 'Create shipments, labels and release fulfillment holds'),
  ('finance.read', 'View payments, credit configuration and commerce policies'),
  ('finance.manage', 'Issue refunds, change terms and credit limits'),
  ('integrations.manage', 'Configure integration accounts and retry failed operations'),
  ('settings.manage', 'Change wholesale, shipping, brand and notification settings'),
  ('staff.manage', 'Assign staff roles and view staff configuration'),
  ('audit.read', 'View audit and integration logs')
on conflict (code) do update set description = excluded.description;

insert into public.staff_roles (code, name) values
  ('ADMINISTRATOR', 'Administrator'),
  ('OPERATIONS', 'Operations'),
  ('CATALOG_MANAGER', 'Catalog manager'),
  ('FINANCE', 'Finance'),
  ('READ_ONLY', 'Read-only staff')
on conflict (code) do update set name = excluded.name;

-- Explicit role mappings. Adding a permission to a role is a migration, so
-- it is reviewed and audited like any other authorization change.
with mapping (role_code, permission_code) as (
  values
    -- Administrator: everything.
    ('ADMINISTRATOR', 'accounts.read'), ('ADMINISTRATOR', 'accounts.manage'),
    ('ADMINISTRATOR', 'applications.review'),
    ('ADMINISTRATOR', 'catalog.read'), ('ADMINISTRATOR', 'catalog.manage'),
    ('ADMINISTRATOR', 'pricing.read'), ('ADMINISTRATOR', 'pricing.manage'),
    ('ADMINISTRATOR', 'orders.read'), ('ADMINISTRATOR', 'orders.manage'), ('ADMINISTRATOR', 'orders.assist'),
    ('ADMINISTRATOR', 'fulfillment.manage'),
    ('ADMINISTRATOR', 'finance.read'), ('ADMINISTRATOR', 'finance.manage'),
    ('ADMINISTRATOR', 'integrations.manage'), ('ADMINISTRATOR', 'settings.manage'),
    ('ADMINISTRATOR', 'staff.manage'), ('ADMINISTRATOR', 'audit.read'),
    -- Operations: accounts, applications, orders, fulfillment.
    ('OPERATIONS', 'accounts.read'), ('OPERATIONS', 'accounts.manage'),
    ('OPERATIONS', 'applications.review'),
    ('OPERATIONS', 'catalog.read'), ('OPERATIONS', 'pricing.read'),
    ('OPERATIONS', 'orders.read'), ('OPERATIONS', 'orders.manage'), ('OPERATIONS', 'orders.assist'),
    ('OPERATIONS', 'fulfillment.manage'),
    -- Catalog manager: catalog and pricing.
    ('CATALOG_MANAGER', 'catalog.read'), ('CATALOG_MANAGER', 'catalog.manage'),
    ('CATALOG_MANAGER', 'pricing.read'), ('CATALOG_MANAGER', 'pricing.manage'),
    ('CATALOG_MANAGER', 'accounts.read'),
    -- Finance: payments, refunds, credit.
    ('FINANCE', 'accounts.read'), ('FINANCE', 'orders.read'),
    ('FINANCE', 'finance.read'), ('FINANCE', 'finance.manage'),
    ('FINANCE', 'pricing.read'), ('FINANCE', 'audit.read'),
    -- Read-only staff: operational reads.
    ('READ_ONLY', 'accounts.read'), ('READ_ONLY', 'catalog.read'),
    ('READ_ONLY', 'pricing.read'), ('READ_ONLY', 'orders.read')
)
insert into public.staff_role_permissions (role_id, permission_id)
select r.id, p.id
from mapping m
join public.staff_roles r on r.code = m.role_code
join public.permissions p on p.code = m.permission_code
on conflict (role_id, permission_id) do nothing;

insert into public.pricing_tiers (code, name) values
  ('STANDARD', 'Standard'),
  ('BRONZE', 'Bronze'),
  ('SILVER', 'Silver'),
  ('GOLD', 'Gold'),
  ('CUSTOM', 'Custom')
on conflict (code) do update set name = excluded.name;
-- Phase 1 / staff projections.
-- Customer column grants deliberately exclude staff-only columns such as
-- companies.pricing_tier_id. Staff read those through permission-gated
-- SECURITY DEFINER functions instead of wider role-level grants.

create or replace function public.admin_companies()
returns table (
  id uuid,
  legal_name text,
  display_name text,
  email text,
  phone text,
  website text,
  status text,
  pricing_tier_code text,
  pricing_tier_name text,
  member_count bigint,
  created_at timestamptz,
  updated_at timestamptz,
  version bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('accounts.read') then
    raise exception 'accounts.read permission required' using errcode = '42501';
  end if;

  return query
  select
    c.id, c.legal_name, c.display_name, c.email, c.phone, c.website, c.status,
    t.code, t.name,
    (select count(*) from public.company_users cu where cu.company_id = c.id and cu.active),
    c.created_at, c.updated_at, c.version
  from public.companies c
  left join public.pricing_tiers t on t.id = c.pricing_tier_id
  order by c.created_at desc;
end;
$$;
revoke all on function public.admin_companies() from public, anon;
grant execute on function public.admin_companies() to authenticated;

create or replace function public.admin_company_counts()
returns table (status text, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('accounts.read') then
    raise exception 'accounts.read permission required' using errcode = '42501';
  end if;

  return query
  select c.status, count(*)
  from public.companies c
  group by c.status;
end;
$$;
revoke all on function public.admin_company_counts() from public, anon;
grant execute on function public.admin_company_counts() to authenticated;

-- Staff directory for the settings page (administrator only).
create or replace function public.admin_staff_directory()
returns table (
  staff_user_id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role_code text,
  role_name text,
  active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('staff.manage') then
    raise exception 'staff.manage permission required' using errcode = '42501';
  end if;

  return query
  select su.id, p.id, p.email, p.first_name, p.last_name, r.code, r.name, su.active, su.created_at
  from public.staff_users su
  join public.profiles p on p.id = su.user_id
  join public.staff_roles r on r.id = su.role_id
  order by p.last_name, p.first_name;
end;
$$;
revoke all on function public.admin_staff_directory() from public, anon;
grant execute on function public.admin_staff_directory() to authenticated;
-- Staff MFA becomes a switch. It is OFF for now at the owner's request so
-- staff can sign in with a password alone. Enrollment stays available.
--
-- Before production launch, ship a migration that changes
-- private.staff_mfa_required() to return true. Every staff read policy and
-- the app's staff guard consult this single function, so flipping it
-- re-enables enforcement everywhere at once.

create or replace function private.staff_mfa_required()
returns boolean
language sql
immutable
set search_path = ''
as $$
  select false;
$$;
grant execute on function private.staff_mfa_required() to authenticated;

-- True when the session meets the current staff assurance policy.
create or replace function private.staff_assurance_met()
returns boolean
language sql
stable
set search_path = ''
as $$
  select (not private.staff_mfa_required()) or private.session_is_mfa_verified();
$$;
grant execute on function private.staff_assurance_met() to authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.staff_assurance_met()
    and exists (
      select 1
      from public.staff_users su
      where su.user_id = auth.uid()
        and su.active
    );
$$;

create or replace function private.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.staff_assurance_met()
    and exists (
      select 1
      from public.staff_users su
      join public.staff_role_permissions srp on srp.role_id = su.role_id
      join public.permissions p on p.id = srp.permission_id
      where su.user_id = auth.uid()
        and su.active
        and p.code = permission_code
    );
$$;

-- Return type changes (new mfa_required column), so drop and recreate.
drop function public.current_staff_context();

create function public.current_staff_context()
returns table (
  staff_user_id uuid,
  role_code text,
  role_name text,
  mfa_verified boolean,
  mfa_required boolean,
  permissions text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    su.id,
    sr.code,
    sr.name,
    private.session_is_mfa_verified(),
    private.staff_mfa_required(),
    coalesce(
      (
        select array_agg(p.code order by p.code)
        from public.staff_role_permissions srp
        join public.permissions p on p.id = srp.permission_id
        where srp.role_id = su.role_id
      ),
      '{}'::text[]
    )
  from public.staff_users su
  join public.staff_roles sr on sr.id = su.role_id
  where su.user_id = auth.uid()
    and su.active;
$$;
grant execute on function public.current_staff_context() to authenticated;

commit;
