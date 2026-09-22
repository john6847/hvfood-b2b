-- Phase 4: Orders & Multi-Payment Methods (Stripe Card, ACH Direct Debit, Wire Transfer)

-- 1. Sequence for Wholesale Order Numbers ------------------------------------
create sequence if not exists public.order_number_seq start with 10490;

-- 2. Orders Table -----------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_number text not null unique,
  company_id uuid not null references public.companies(id) on delete restrict,
  placed_by_user_id uuid not null references auth.users(id) on delete restrict,
  placed_by_name text not null,
  status text not null default 'CONFIRMED',
  payment_status text not null default 'UNPAID',
  payment_method text not null,
  fulfillment_status text not null default 'UNFULFILLED',
  po_number text,
  currency text not null default 'USD',
  subtotal_minor bigint not null,
  total_minor bigint not null,
  wire_reference text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  internal_notes text,
  constraint orders_status_check check (
    status in ('CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'ON_HOLD', 'CANCELLED')
  ),
  constraint orders_payment_status_check check (
    payment_status in ('PAID', 'PROCESSING', 'UNPAID')
  ),
  constraint orders_payment_method_check check (
    payment_method in ('CARD', 'ACH', 'WIRE')
  ),
  constraint orders_fulfillment_status_check check (
    fulfillment_status in ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED')
  ),
  constraint orders_subtotal_nonnegative check (subtotal_minor >= 0),
  constraint orders_total_nonnegative check (total_minor >= 0)
);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;

create index if not exists orders_company_id_idx on public.orders (company_id);
create index if not exists orders_placed_by_user_id_idx on public.orders (placed_by_user_id);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_payment_method_idx on public.orders (payment_method);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

-- 3. Order Lines Table ------------------------------------------------------
create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  packaging_id uuid references public.product_packaging(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  product_sku text not null,
  pack_description text not null,
  image_url text,
  cases integer not null check (cases > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  total_minor bigint not null check (total_minor >= 0)
);

alter table public.order_lines enable row level security;
revoke all on public.order_lines from anon, authenticated;

create index if not exists order_lines_order_id_idx on public.order_lines (order_id);
create index if not exists order_lines_product_id_idx on public.order_lines (product_id);

-- 4. Permissions and RLS Policies --------------------------------------------
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_lines to authenticated;
grant all on public.orders to service_role;
grant all on public.order_lines to service_role;
grant usage, select on sequence public.order_number_seq to authenticated, service_role;

-- Orders policies
drop policy if exists orders_read_company on public.orders;
create policy orders_read_company on public.orders
  for select to authenticated
  using (
    company_id in (
      select cu.company_id
      from public.company_users cu
      where cu.user_id = (select auth.uid())
        and cu.active = true
    )
  );

drop policy if exists orders_read_staff on public.orders;
create policy orders_read_staff on public.orders
  for select to authenticated
  using (private.has_permission('orders.read'));

drop policy if exists orders_insert_buyer on public.orders;
create policy orders_insert_buyer on public.orders
  for insert to authenticated
  with check (
    company_id in (
      select cu.company_id
      from public.company_users cu
      where cu.user_id = (select auth.uid())
        and cu.active = true
        and cu.role in ('OWNER', 'BUYER')
    )
  );

drop policy if exists orders_manage_staff on public.orders;
create policy orders_manage_staff on public.orders
  for update to authenticated
  using (private.has_permission('orders.manage'))
  with check (private.has_permission('orders.manage'));

-- Order lines policies
drop policy if exists order_lines_read_company on public.order_lines;
create policy order_lines_read_company on public.order_lines
  for select to authenticated
  using (
    order_id in (
      select o.id
      from public.orders o
      join public.company_users cu on cu.company_id = o.company_id
      where cu.user_id = (select auth.uid())
        and cu.active = true
    )
  );

drop policy if exists order_lines_read_staff on public.order_lines;
create policy order_lines_read_staff on public.order_lines
  for select to authenticated
  using (private.has_permission('orders.read'));

drop policy if exists order_lines_insert_buyer on public.order_lines;
create policy order_lines_insert_buyer on public.order_lines
  for insert to authenticated
  with check (
    order_id in (
      select o.id
      from public.orders o
      join public.company_users cu on cu.company_id = o.company_id
      where cu.user_id = (select auth.uid())
        and cu.active = true
        and cu.role in ('OWNER', 'BUYER')
    )
  );

-- 5. Stored Procedures -------------------------------------------------------

-- Create wholesale order (Atomic RPC)
create or replace function public.create_wholesale_order(
  p_company_id uuid,
  p_payment_method text,
  p_payment_status text default 'UNPAID',
  p_po_number text default null,
  p_stripe_session_id text default null,
  p_stripe_payment_intent_id text default null,
  p_lines jsonb default '[]'::jsonb
)
returns table (
  order_id uuid,
  order_number text,
  wire_reference text,
  total_minor bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_caller_name text;
  v_order_num_seq bigint;
  v_order_number text;
  v_wire_ref text := null;
  v_order_id uuid;
  v_subtotal bigint := 0;
  v_total bigint := 0;
  v_line jsonb;
  v_cases integer;
  v_unit_price bigint;
  v_line_total bigint;
  v_status text := 'CONFIRMED';
  v_is_authorized boolean := false;
begin
  v_caller_id := auth.uid();

  -- Authorize caller: either active company member (BUYER/OWNER), staff with orders.assist, or service_role
  if v_caller_id is null then
    -- Service role invocation (e.g. webhook handler or background script)
    v_is_authorized := true;
    -- Find an active user in company or fall back
    select cu.user_id into v_caller_id
    from public.company_users cu
    where cu.company_id = p_company_id and cu.active = true
    order by cu.created_at asc
    limit 1;
  else
    select exists (
      select 1
      from public.company_users cu
      where cu.company_id = p_company_id
        and cu.user_id = v_caller_id
        and cu.active = true
        and cu.role in ('OWNER', 'BUYER')
    ) or private.has_permission('orders.assist') into v_is_authorized;
  end if;

  if not v_is_authorized then
    raise exception 'Unauthorized to create orders for this company.'
      using errcode = '42501';
  end if;

  -- Resolve placed_by_name
  select coalesce(nullif(btrim(concat(p.first_name, ' ', p.last_name)), ''), p.email, 'Wholesale Buyer')
  into v_caller_name
  from public.profiles p
  where p.id = v_caller_id;

  if v_caller_name is null then
    v_caller_name := 'Wholesale Buyer';
  end if;

  -- Validate payment method
  if p_payment_method not in ('CARD', 'ACH', 'WIRE') then
    raise exception 'Invalid payment method: %', p_payment_method
      using errcode = '22023';
  end if;

  -- Generate order number and wire reference
  v_order_num_seq := nextval('public.order_number_seq');
  v_order_number := 'HV-' || v_order_num_seq::text;

  if p_payment_method = 'WIRE' then
    v_wire_ref := 'HV-WIRE-' || v_order_num_seq::text;
    v_status := 'ON_HOLD';
  elsif p_payment_status = 'PROCESSING' then
    v_status := 'ON_HOLD';
  elsif p_payment_status = 'PAID' then
    v_status := 'PROCESSING';
  end if;

  -- Calculate total from lines
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_cases := (v_line->>'cases')::integer;
    v_unit_price := (v_line->>'unit_price_minor')::bigint;
    v_line_total := v_cases * v_unit_price;
    v_subtotal := v_subtotal + v_line_total;
  end loop;
  v_total := v_subtotal;

  -- Insert order
  insert into public.orders (
    order_number,
    company_id,
    placed_by_user_id,
    placed_by_name,
    status,
    payment_status,
    payment_method,
    fulfillment_status,
    po_number,
    currency,
    subtotal_minor,
    total_minor,
    wire_reference,
    stripe_session_id,
    stripe_payment_intent_id
  ) values (
    v_order_number,
    p_company_id,
    v_caller_id,
    v_caller_name,
    v_status,
    p_payment_status,
    p_payment_method,
    'UNFULFILLED',
    nullif(btrim(p_po_number), ''),
    'USD',
    v_subtotal,
    v_total,
    v_wire_ref,
    nullif(btrim(p_stripe_session_id), ''),
    nullif(btrim(p_stripe_payment_intent_id), '')
  ) returning id into v_order_id;

  -- Insert order lines
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_cases := (v_line->>'cases')::integer;
    v_unit_price := (v_line->>'unit_price_minor')::bigint;
    v_line_total := v_cases * v_unit_price;

    insert into public.order_lines (
      order_id,
      product_id,
      packaging_id,
      product_slug,
      product_name,
      product_sku,
      pack_description,
      image_url,
      cases,
      unit_price_minor,
      total_minor
    ) values (
      v_order_id,
      nullif(v_line->>'product_id', '')::uuid,
      nullif(v_line->>'packaging_id', '')::uuid,
      coalesce(v_line->>'product_slug', ''),
      coalesce(v_line->>'product_name', 'Product'),
      coalesce(v_line->>'product_sku', ''),
      coalesce(v_line->>'pack_description', ''),
      v_line->>'image_url',
      v_cases,
      v_unit_price,
      v_line_total
    );
  end loop;

  return query select v_order_id, v_order_number, v_wire_ref, v_total;
end;
$$;

grant execute on function public.create_wholesale_order(uuid, text, text, text, text, text, jsonb) to authenticated, service_role;

-- Staff action: Confirm incoming wire payment
create or replace function public.admin_confirm_wire_payment(
  p_order_id uuid,
  p_internal_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_current_payment_status text;
  v_current_status text;
  v_notes text;
begin
  v_caller_id := auth.uid();

  -- Verify staff authorization
  if v_caller_id is not null and not private.has_permission('orders.manage') then
    raise exception 'Permission denied: orders.manage required to reconcile wire payments.'
      using errcode = '42501';
  end if;

  select payment_status, status, internal_notes
  into v_current_payment_status, v_current_status, v_notes
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if v_current_payment_status = 'PAID' then
    return true;
  end if;

  update public.orders
  set
    payment_status = 'PAID',
    status = case when status = 'ON_HOLD' then 'PROCESSING' else status end,
    internal_notes = concat_ws(E'\n', v_notes, p_internal_notes, 'Wire payment confirmed on ' || now()::text),
    updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

grant execute on function public.admin_confirm_wire_payment(uuid, text) to authenticated, service_role;
