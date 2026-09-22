-- Phase 3: Catalog and Pricing Schema
-- Defines categories, products, packaging specifications, price lists, and volume breaks.

-- 1. Product Categories --------------------------------------------------------

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.product_categories(id) on delete set null,
  sort_order integer not null default 0,
  active boolean not null default true,
  constraint product_categories_name_nonempty check (length(btrim(name)) > 0),
  constraint product_categories_parent_check check (parent_id is null or parent_id <> id)
);

alter table public.product_categories enable row level security;
revoke all on public.product_categories from anon, authenticated;

create index product_categories_slug_idx on public.product_categories (slug);
create index product_categories_parent_id_idx on public.product_categories (parent_id);
create index product_categories_sort_idx on public.product_categories (sort_order, name);

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function private.set_updated_at();

-- 2. Products -----------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shopify_product_id text,
  shopify_variant_id text unique,
  sku text not null unique,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  brand text not null default 'Horizon Vert',
  category_id uuid references public.product_categories(id) on delete set null,
  wholesale_name_override text,
  wholesale_description_override text,
  active boolean not null default true,
  wholesale_enabled boolean not null default true,
  base_unit text not null default 'EACH' check (base_unit in ('EACH', 'G', 'ML')),
  ingredients text,
  allergens text,
  storage_requirements text,
  shelf_life_days integer check (shelf_life_days is null or shelf_life_days > 0),
  country_of_origin text,
  tag text,
  version bigint not null default 1,
  constraint products_name_nonempty check (length(btrim(name)) > 0),
  constraint products_sku_nonempty check (length(btrim(sku)) > 0)
);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;

create index products_category_id_idx on public.products (category_id);
create index products_slug_idx on public.products (slug);
create index products_sku_idx on public.products (sku);
create index products_active_idx on public.products (active, wholesale_enabled);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

create trigger products_bump_version
  before update on public.products
  for each row execute function private.bump_version();

-- 3. Product Packaging (Case Packs & Units) -----------------------------------

create table public.product_packaging (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  type text not null default 'CASE' check (type in ('UNIT', 'CASE', 'BOX', 'BAG', 'PALLET', 'KG', 'LB')),
  sku text not null unique,
  barcode text unique,
  base_unit_quantity numeric(18,6) not null default 1 check (base_unit_quantity > 0),
  units_per_case integer not null default 1 check (units_per_case > 0),
  weight_g numeric(18,3) check (weight_g is null or weight_g > 0),
  minimum_quantity numeric(18,6) not null default 1 check (minimum_quantity > 0),
  maximum_quantity numeric(18,6) check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  quantity_increment numeric(18,6) not null default 1 check (quantity_increment > 0),
  freight_class text,
  active boolean not null default true,
  constraint product_packaging_name_nonempty check (length(btrim(name)) > 0)
);

alter table public.product_packaging enable row level security;
revoke all on public.product_packaging from anon, authenticated;

create index product_packaging_product_id_idx on public.product_packaging (product_id);
create index product_packaging_sku_idx on public.product_packaging (sku);

create trigger product_packaging_set_updated_at
  before update on public.product_packaging
  for each row execute function private.set_updated_at();

-- 4. Price Lists --------------------------------------------------------------

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  currency text not null default 'USD' check (currency = 'USD'),
  scope text not null default 'TIER' check (scope in ('DEFAULT', 'TIER', 'COMPANY')),
  pricing_tier_id uuid references public.pricing_tiers(id) on delete cascade,
  active boolean not null default true,
  version bigint not null default 1,
  constraint price_lists_scope_tier_check check (
    (scope = 'TIER' and pricing_tier_id is not null) or (scope <> 'TIER' and pricing_tier_id is null)
  ),
  unique (scope, pricing_tier_id)
);

alter table public.price_lists enable row level security;
revoke all on public.price_lists from anon, authenticated;

create index price_lists_pricing_tier_id_idx on public.price_lists (pricing_tier_id);

create trigger price_lists_set_updated_at
  before update on public.price_lists
  for each row execute function private.set_updated_at();

-- 5. Price List Items ---------------------------------------------------------

create table public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  packaging_id uuid not null references public.product_packaging(id) on delete cascade,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  unique (price_list_id, packaging_id)
);

alter table public.price_list_items enable row level security;
revoke all on public.price_list_items from anon, authenticated;

create index price_list_items_price_list_id_idx on public.price_list_items (price_list_id);
create index price_list_items_packaging_id_idx on public.price_list_items (packaging_id);

create trigger price_list_items_set_updated_at
  before update on public.price_list_items
  for each row execute function private.set_updated_at();

-- 6. Quantity Price Breaks (Volume Discounts) ---------------------------------

create table public.quantity_price_breaks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  price_list_item_id uuid not null references public.price_list_items(id) on delete cascade,
  minimum_quantity numeric(18,6) not null check (minimum_quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  unique (price_list_item_id, minimum_quantity)
);

alter table public.quantity_price_breaks enable row level security;
revoke all on public.quantity_price_breaks from anon, authenticated;

create index quantity_price_breaks_item_id_idx on public.quantity_price_breaks (price_list_item_id);

create trigger quantity_price_breaks_set_updated_at
  before update on public.quantity_price_breaks
  for each row execute function private.set_updated_at();

-- 7. Grants and Row-Level Security --------------------------------------------

-- Service role has full permissions across catalog tables
grant all on public.product_categories to service_role;
grant all on public.products to service_role;
grant all on public.product_packaging to service_role;
grant all on public.price_lists to service_role;
grant all on public.price_list_items to service_role;
grant all on public.quantity_price_breaks to service_role;

-- Public and authenticated users can view active categories, products, and packaging
grant select on public.product_categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_packaging to anon, authenticated;

create policy product_categories_select_public
  on public.product_categories for select to anon, authenticated
  using (active = true);

create policy products_select_public
  on public.products for select to anon, authenticated
  using (active = true and wholesale_enabled = true);

create policy product_packaging_select_public
  on public.product_packaging for select to anon, authenticated
  using (active = true);

-- Pricing tables: Only authenticated users with active company or staff access
grant select on public.price_lists to authenticated;
grant select on public.price_list_items to authenticated;
grant select on public.quantity_price_breaks to authenticated;

create policy price_lists_select_staff
  on public.price_lists for select to authenticated
  using (private.has_permission('catalog.read') or private.has_permission('pricing.read'));

create policy price_lists_select_company
  on public.price_lists for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      join public.company_users cu on cu.company_id = c.id
      where cu.user_id = auth.uid()
        and cu.active = true
        and c.status = 'APPROVED'
        and c.pricing_tier_id = price_lists.pricing_tier_id
    )
  );

create policy price_list_items_select_staff
  on public.price_list_items for select to authenticated
  using (private.has_permission('catalog.read') or private.has_permission('pricing.read'));

create policy price_list_items_select_company
  on public.price_list_items for select to authenticated
  using (
    exists (
      select 1 from public.price_lists pl
      join public.companies c on c.pricing_tier_id = pl.pricing_tier_id
      join public.company_users cu on cu.company_id = c.id
      where pl.id = price_list_items.price_list_id
        and cu.user_id = auth.uid()
        and cu.active = true
        and c.status = 'APPROVED'
    )
  );

create policy quantity_price_breaks_select_staff
  on public.quantity_price_breaks for select to authenticated
  using (private.has_permission('catalog.read') or private.has_permission('pricing.read'));

create policy quantity_price_breaks_select_company
  on public.quantity_price_breaks for select to authenticated
  using (
    exists (
      select 1 from public.price_list_items pli
      join public.price_lists pl on pl.id = pli.price_list_id
      join public.companies c on c.pricing_tier_id = pl.pricing_tier_id
      join public.company_users cu on cu.company_id = c.id
      where pli.id = quantity_price_breaks.price_list_item_id
        and cu.user_id = auth.uid()
        and cu.active = true
        and c.status = 'APPROVED'
    )
  );

-- 8. Catalog Helper View/RPC --------------------------------------------------

/**
 * Returns the effective catalog for a given company (or standard tier if approved).
 * If caller is not authorized for that company, returns unpriced products.
 */
create or replace function public.get_catalog_for_company(p_company_id uuid default null)
returns table (
  product_id uuid,
  product_sku text,
  product_name text,
  product_slug text,
  product_description text,
  image_url text,
  brand text,
  category_name text,
  category_slug text,
  tag text,
  pack_name text,
  pack_sku text,
  units_per_case integer,
  case_price_minor bigint,
  volume_breaks jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier_id uuid;
  v_is_authorized boolean := false;
begin
  if p_company_id is not null and auth.uid() is not null then
    -- Check if user is active member of approved company or staff
    if private.is_active_member(p_company_id) or private.has_permission('catalog.read') then
      v_is_authorized := true;
      select c.pricing_tier_id into v_tier_id
      from public.companies c
      where c.id = p_company_id and c.status = 'APPROVED';
    end if;
  end if;

  return query
  select
    p.id as product_id,
    p.sku as product_sku,
    p.name as product_name,
    p.slug as product_slug,
    p.description as product_description,
    p.image_url,
    p.brand,
    coalesce(c.name, 'General') as category_name,
    coalesce(c.slug, 'general') as category_slug,
    p.tag,
    pkg.name as pack_name,
    pkg.sku as pack_sku,
    pkg.units_per_case,
    case when v_is_authorized and v_tier_id is not null then pli.unit_price_minor else null end as case_price_minor,
    case when v_is_authorized and v_tier_id is not null then (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'minimumCases', qpb.minimum_quantity,
          'unitPriceMinor', qpb.unit_price_minor
        ) order by qpb.minimum_quantity asc
      ), '[]'::jsonb)
      from public.quantity_price_breaks qpb
      where qpb.price_list_item_id = pli.id
    ) else '[]'::jsonb end as volume_breaks
  from public.products p
  left join public.product_categories c on c.id = p.category_id
  join public.product_packaging pkg on pkg.product_id = p.id and pkg.active = true
  left join public.price_lists pl on pl.pricing_tier_id = v_tier_id and pl.active = true
  left join public.price_list_items pli on pli.price_list_id = pl.id and pli.packaging_id = pkg.id
  where p.active = true and p.wholesale_enabled = true
  order by c.sort_order asc, p.name asc;
end;
$$;

grant execute on function public.get_catalog_for_company to anon, authenticated, service_role;
