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
