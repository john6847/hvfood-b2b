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
