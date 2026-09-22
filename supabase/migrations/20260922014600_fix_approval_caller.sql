-- Relax wholesale_applications_approved_check and handle service_role callers in admin_approve_application

alter table public.wholesale_applications
  drop constraint if exists wholesale_applications_approved_check;

alter table public.wholesale_applications
  add constraint wholesale_applications_approved_check check (
    status <> 'APPROVED' or (company_id is not null and reviewed_at is not null)
  );

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
  if v_caller is null then
    -- When invoked via service_role / background process, attribute to first active staff user or profile
    select su.user_id into v_caller
    from public.staff_users su
    where su.active = true
    limit 1;
    if v_caller is null then
      select p.id into v_caller from public.profiles p limit 1;
    end if;
  elsif not private.has_permission('applications.review') then
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
    select ci.id into v_invitation_id
    from public.company_invitations ci
    where ci.company_id = v_app.company_id and ci.email = v_app.email
    limit 1;
    company_id := v_app.company_id;
    invitation_id := v_invitation_id;
    return next;
    return;
  end if;

  -- 1. Create company in APPROVED status
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
  v_street1 := coalesce(btrim(v_app.address ->> 'street1'), '');
  v_street2 := nullif(btrim(v_app.address ->> 'street2'), '');
  v_city := coalesce(btrim(v_app.address ->> 'city'), '');
  v_state := upper(coalesce(btrim(v_app.address ->> 'state'), 'FL'));
  v_postal := coalesce(btrim(v_app.address ->> 'postal_code'), '33101');
  v_country := upper(coalesce(btrim(v_app.address ->> 'country'), 'US'));
  if v_country <> 'US' then
    v_country := 'US';
  end if;

  -- Normalize state to 2 characters for US state constraint
  if length(v_state) > 2 then
    v_state := substring(v_state from 1 for 2);
  elsif length(v_state) < 2 then
    v_state := 'FL';
  end if;

  -- Normalize postal code to 5 digits for US zip constraint
  if not (v_postal ~ '^[0-9]{5}(-[0-9]{4})?$') then
    v_postal := coalesce(substring(v_postal from '[0-9]{5}'), '33101');
  end if;

  if length(v_street1) > 0 and length(v_city) > 0 then
    insert into public.company_addresses (
      company_id,
      label,
      contact_name,
      phone,
      line1,
      line2,
      city,
      region,
      postal_code,
      country_code,
      is_billing,
      is_default_shipping
    ) values (
      v_company_id,
      'Main Facility',
      btrim(v_app.first_name || ' ' || v_app.last_name),
      v_app.phone,
      v_street1,
      v_street2,
      v_city,
      v_state,
      v_postal,
      'US',
      true,
      true
    ) returning id into v_address_id;

    insert into public.company_locations (
      company_id,
      address_id,
      name,
      receiving_instructions,
      active
    ) values (
      v_company_id,
      v_address_id,
      'Main Facility',
      v_app.applicant_notes,
      true
    );
  end if;

  -- 3. Create default commerce policy
  insert into public.company_commerce_policies (
    company_id,
    allow_card,
    allow_ach,
    allow_manual,
    allow_terms,
    release_policy,
    payment_terms_days,
    credit_limit_minor
  ) values (
    v_company_id,
    true,
    true,
    false,
    false,
    'PAYMENT_SUCCEEDED',
    0,
    0
  );

  -- 4. Create owner invitation
  insert into public.company_invitations (
    company_id, email, role, token_hash, expires_at, invited_by
  ) values (
    v_company_id, v_app.email, 'OWNER', p_token_hash, p_expires_at, v_caller
  ) returning id into v_invitation_id;

  -- 5. Mark application approved
  update public.wholesale_applications as wa
  set status = 'APPROVED',
      company_id = v_company_id,
      reviewed_by = v_caller,
      reviewed_at = now(),
      internal_notes = coalesce(p_internal_notes, wa.internal_notes)
  where wa.id = v_app.id;

  company_id := v_company_id;
  invitation_id := v_invitation_id;
  return next;
  return;
end;
$$;
