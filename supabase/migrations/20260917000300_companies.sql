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
