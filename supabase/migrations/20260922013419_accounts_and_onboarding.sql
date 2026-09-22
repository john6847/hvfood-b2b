-- Phase 2 / accounts and onboarding: wholesale applications, company invitations,
-- tax exemptions, and transactional onboarding procedures.

-- 1. Wholesale Applications ---------------------------------------------------

create table public.wholesale_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  business_name text not null,
  email text not null,
  phone text not null,
  website text,
  business_type text not null,
  address jsonb not null,
  business_number text,
  estimated_monthly_volume text,
  products_interested_in text[] not null default '{}',
  applicant_notes text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  company_id uuid references public.companies(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  internal_notes text,
  customer_message text,
  submission_key uuid not null unique,
  constraint wholesale_applications_email_nonempty check (length(btrim(email)) > 0),
  constraint wholesale_applications_business_name_nonempty check (length(btrim(business_name)) > 0),
  constraint wholesale_applications_first_name_nonempty check (length(btrim(first_name)) > 0),
  constraint wholesale_applications_last_name_nonempty check (length(btrim(last_name)) > 0),
  constraint wholesale_applications_approved_check check (
    status <> 'APPROVED' or (company_id is not null and reviewed_by is not null and reviewed_at is not null)
  )
);

alter table public.wholesale_applications enable row level security;
revoke all on public.wholesale_applications from anon, authenticated;

create index wholesale_applications_email_idx on public.wholesale_applications (lower(email));
create index wholesale_applications_status_created_idx on public.wholesale_applications (status, created_at desc);
create index wholesale_applications_company_id_idx on public.wholesale_applications (company_id);
create index wholesale_applications_reviewed_by_idx on public.wholesale_applications (reviewed_by);

create trigger wholesale_applications_set_updated_at
  before update on public.wholesale_applications
  for each row execute function private.set_updated_at();

-- 2. Company Invitations ------------------------------------------------------

create table public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('OWNER', 'BUYER', 'VIEWER')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint company_invitations_email_nonempty check (length(btrim(email)) > 0),
  constraint company_invitations_expiry_check check (expires_at > created_at)
);

alter table public.company_invitations enable row level security;
revoke all on public.company_invitations from anon, authenticated;

create index company_invitations_email_idx on public.company_invitations (lower(email));
create index company_invitations_company_id_idx on public.company_invitations (company_id);
create index company_invitations_token_hash_idx on public.company_invitations (token_hash);

create trigger company_invitations_set_updated_at
  before update on public.company_invitations
  for each row execute function private.set_updated_at();

-- 3. Tax Exemptions -----------------------------------------------------------

create table public.tax_exemptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id) on delete cascade,
  jurisdiction text not null,
  certificate_storage_path text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
  valid_from date,
  valid_until date,
  verified_by uuid references public.profiles(id) on delete set null,
  constraint tax_exemptions_date_check check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

alter table public.tax_exemptions enable row level security;
revoke all on public.tax_exemptions from anon, authenticated;

create index tax_exemptions_company_id_idx on public.tax_exemptions (company_id);

create trigger tax_exemptions_set_updated_at
  before update on public.tax_exemptions
  for each row execute function private.set_updated_at();

-- 4. Grants and Row-Level Security --------------------------------------------

-- service_role has full table privileges
grant all on public.wholesale_applications to service_role;
grant all on public.company_invitations to service_role;
grant all on public.tax_exemptions to service_role;

-- authenticated role permissions
grant select, update on public.wholesale_applications to authenticated;
grant select on public.company_invitations to authenticated;
grant select, insert on public.tax_exemptions to authenticated;

-- Staff with applications.review can read applications
create policy wholesale_applications_select_staff
  on public.wholesale_applications for select to authenticated
  using (private.has_permission('applications.review'));

-- Staff with applications.review can update applications (notes, review)
create policy wholesale_applications_update_staff
  on public.wholesale_applications for update to authenticated
  using (private.has_permission('applications.review'))
  with check (private.has_permission('applications.review'));

-- Staff with accounts.read can view invitations
create policy company_invitations_select_staff
  on public.company_invitations for select to authenticated
  using (private.has_permission('accounts.read'));

-- Company owners can view invitations for their company
create policy company_invitations_select_owner
  on public.company_invitations for select to authenticated
  using (private.is_company_owner(company_id));

-- Staff with finance.read can view all exemptions
create policy tax_exemptions_select_staff
  on public.tax_exemptions for select to authenticated
  using (private.has_permission('finance.read'));

-- Members of approved company can view company exemptions
create policy tax_exemptions_select_company
  on public.tax_exemptions for select to authenticated
  using (private.is_active_member(company_id));

-- Company owners can submit exemption certificates
create policy tax_exemptions_insert_owner
  on public.tax_exemptions for insert to authenticated
  with check (private.is_company_owner(company_id));

-- 5. Transactional Onboarding Procedures --------------------------------------

/**
 * Atomically approves a wholesale application:
 * 1. Creates the company record in APPROVED status with the chosen pricing tier.
 * 2. Creates the default company address and delivery location from application data.
 * 3. Creates an owner invitation with token_hash.
 * 4. Updates the application record with reviewed_by, reviewed_at, company_id.
 */
create or replace function public.admin_approve_application(
  p_application_id uuid,
  p_pricing_tier_id uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_internal_notes text default null
)
returns table (
  company_id uuid,
  invitation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.wholesale_applications%rowtype;
  v_company_id uuid;
  v_address_id uuid;
  v_invitation_id uuid;
  v_caller uuid;
  v_street1 text;
  v_street2 text;
  v_city text;
  v_state text;
  v_postal text;
  v_country text;
begin
  v_caller := auth.uid();
  if v_caller is not null and not private.has_permission('applications.review') then
    raise exception 'Permission denied: applications.review required';
  end if;

  select * into v_app
  from public.wholesale_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application % not found', p_application_id;
  end if;

  if v_app.status = 'APPROVED' and v_app.company_id is not null then
    select id into v_invitation_id
    from public.company_invitations
    where company_id = v_app.company_id and email = v_app.email
    limit 1;
    return query select v_app.company_id, v_invitation_id;
    return;
  end if;

  -- 1. Create company
  insert into public.companies (
    legal_name, display_name, email, phone, website, status, pricing_tier_id
  ) values (
    v_app.business_name,
    v_app.business_name,
    v_app.email,
    v_app.phone,
    v_app.website,
    'APPROVED',
    p_pricing_tier_id
  ) returning id into v_company_id;

  -- 2. Create address from jsonb
  v_street1 := coalesce(v_app.address ->> 'street1', '');
  v_street2 := nullif(v_app.address ->> 'street2', '');
  v_city := coalesce(v_app.address ->> 'city', '');
  v_state := upper(coalesce(v_app.address ->> 'state', ''));
  v_postal := coalesce(v_app.address ->> 'postal_code', '');
  v_country := coalesce(v_app.address ->> 'country', 'US');

  if length(v_street1) > 0 and length(v_city) > 0 and length(v_state) > 0 and length(v_postal) > 0 then
    insert into public.company_addresses (
      company_id, name, address_line1, address_line2, city, state_province, postal_code, country, address_type
    ) values (
      v_company_id, 'Primary Location', v_street1, v_street2, v_city, v_state, v_postal, v_country, 'BOTH'
    ) returning id into v_address_id;

    insert into public.company_locations (
      company_id, address_id, name, is_default, active
    ) values (
      v_company_id, v_address_id, 'Main Warehouse', true, true
    );
  end if;

  -- 3. Create owner invitation
  insert into public.company_invitations (
    company_id, email, role, token_hash, expires_at, invited_by
  ) values (
    v_company_id, v_app.email, 'OWNER', p_token_hash, p_expires_at, v_caller
  ) returning id into v_invitation_id;

  -- 4. Mark application approved
  update public.wholesale_applications
  set status = 'APPROVED',
      company_id = v_company_id,
      reviewed_by = v_caller,
      reviewed_at = now(),
      internal_notes = coalesce(p_internal_notes, internal_notes)
  where id = v_app.id;

  return query select v_company_id, v_invitation_id;
end;
$$;

grant execute on function public.admin_approve_application to authenticated, service_role;

/**
 * Rejects a wholesale application with optional internal notes and customer message.
 */
create or replace function public.admin_reject_application(
  p_application_id uuid,
  p_internal_notes text default null,
  p_customer_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is not null and not private.has_permission('applications.review') then
    raise exception 'Permission denied: applications.review required';
  end if;

  update public.wholesale_applications
  set status = 'REJECTED',
      reviewed_by = v_caller,
      reviewed_at = now(),
      internal_notes = coalesce(p_internal_notes, internal_notes),
      customer_message = coalesce(p_customer_message, customer_message)
  where id = p_application_id;

  if not found then
    raise exception 'Application % not found', p_application_id;
  end if;
end;
$$;

grant execute on function public.admin_reject_application to authenticated, service_role;

/**
 * Publicly retrieves non-sensitive details for an invitation by token hash.
 */
create or replace function public.get_invitation_details(
  p_token_hash text
)
returns table (
  invitation_id uuid,
  company_id uuid,
  company_name text,
  email text,
  role text,
  is_expired boolean,
  is_accepted boolean,
  is_revoked boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    i.id as invitation_id,
    c.id as company_id,
    c.display_name as company_name,
    i.email,
    i.role,
    (i.expires_at <= now()) as is_expired,
    (i.accepted_at is not null) as is_accepted,
    (i.revoked_at is not null) as is_revoked
  from public.company_invitations i
  join public.companies c on c.id = i.company_id
  where i.token_hash = p_token_hash;
$$;

grant execute on function public.get_invitation_details to anon, authenticated, service_role;

/**
 * Accepts an invitation:
 * Verifies authenticated user, matches email, creates company_users membership,
 * and marks invitation accepted.
 */
create or replace function public.accept_invitation(
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.company_invitations%rowtype;
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to accept invitation';
  end if;

  select email into v_user_email
  from auth.users
  where id = v_user_id;

  select * into v_inv
  from public.company_invitations
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_inv.revoked_at is not null then
    raise exception 'This invitation has been revoked';
  end if;

  if v_inv.accepted_at is not null then
    return v_inv.company_id;
  end if;

  if v_inv.expires_at <= now() then
    raise exception 'This invitation has expired';
  end if;

  if lower(v_inv.email) <> lower(v_user_email) then
    raise exception 'This invitation was sent to %, but you are signed in as %', v_inv.email, v_user_email;
  end if;

  -- Create or activate membership
  insert into public.company_users (
    company_id, user_id, role, active
  ) values (
    v_inv.company_id, v_user_id, v_inv.role, true
  )
  on conflict (company_id, user_id) do update
  set role = excluded.role,
      active = true;

  -- Mark invitation accepted
  update public.company_invitations
  set accepted_by = v_user_id,
      accepted_at = now()
  where id = v_inv.id;

  return v_inv.company_id;
end;
$$;

grant execute on function public.accept_invitation to authenticated, service_role;
