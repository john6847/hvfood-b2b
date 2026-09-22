-- Drop and recreate get_catalog_for_company to support service_role and include available column

drop function if exists public.get_catalog_for_company(uuid);

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
  available boolean,
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
  if p_company_id is not null then
    -- When invoked with service_role (auth.uid() is null) or by an active company member / catalog staff:
    if auth.uid() is null or private.is_active_member(p_company_id) or private.has_permission('catalog.read') then
      v_is_authorized := true;
      select c.pricing_tier_id into v_tier_id
      from public.companies c
      where c.id = p_company_id and c.status = 'APPROVED';
      -- If company has no tier assigned, fallback to standard tier
      if v_tier_id is null then
        select pt.id into v_tier_id from public.pricing_tiers pt where pt.code = 'STANDARD' limit 1;
      end if;
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
    p.active as available,
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
