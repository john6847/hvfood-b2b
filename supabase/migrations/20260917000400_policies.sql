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
