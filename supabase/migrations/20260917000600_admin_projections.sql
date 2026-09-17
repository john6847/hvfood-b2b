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
