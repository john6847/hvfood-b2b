-- Horizon Vert Foods: proposed full target schema (DESIGN ONLY).
-- Not a migration and not deployed. Requires Supabase auth.users and roles.
-- Tables are deliberately inaccessible to anon/authenticated until phase-specific
-- RLS policies, safe RPCs and grants are implemented and tested.
-- USD / US-only constraints are intentional launch scope, not multi-currency support.
-- Do not apply to production. See database.md for transaction-level invariants.
BEGIN;

CREATE TABLE public.profiles (
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
id uuid primary key references auth.users(id),
email text not null,
first_name text not null default '',
last_name text not null default '',
phone text,
locale text not null default 'en-US'
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon, authenticated;

CREATE TABLE public.staff_roles (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
code text not null unique, name text not null
);
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_roles FROM anon, authenticated;

CREATE TABLE public.permissions (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
code text not null unique, description text not null
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.permissions FROM anon, authenticated;

CREATE TABLE public.staff_role_permissions (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
role_id uuid not null references public.staff_roles(id),
permission_id uuid not null references public.permissions(id), unique (role_id, permission_id)
);
ALTER TABLE public.staff_role_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_role_permissions FROM anon, authenticated;

CREATE TABLE public.staff_users (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
user_id uuid not null unique references public.profiles(id),
role_id uuid not null references public.staff_roles(id), active boolean not null default true
);
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_users FROM anon, authenticated;

CREATE TABLE public.pricing_tiers (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
code text not null unique, name text not null, active boolean not null default true
);
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pricing_tiers FROM anon, authenticated;

CREATE TABLE public.companies (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
legal_name text not null, display_name text not null,
email text not null, phone text, website text,
status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','SUSPENDED')),
pricing_tier_id uuid references public.pricing_tiers(id), currency text not null default 'USD' check (currency = 'USD'),
version bigint not null default 1
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.companies FROM anon, authenticated;

CREATE TABLE public.company_users (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
user_id uuid not null references public.profiles(id),
role text not null check (role in ('OWNER','BUYER','VIEWER')),
active boolean not null default true,
unique (company_id, user_id), unique (id, company_id)
);
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_users FROM anon, authenticated;

CREATE TABLE public.company_private_details (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null unique references public.companies(id),
business_number text, tax_number text, internal_notes text
);
ALTER TABLE public.company_private_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_private_details FROM anon, authenticated;

CREATE TABLE public.company_commerce_policies (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null unique references public.companies(id),
payment_terms_days integer not null default 0 check (payment_terms_days in (0,15,30,45)),
credit_limit_minor bigint not null default 0 check (credit_limit_minor >= 0),
order_minimum_minor bigint check (order_minimum_minor >= 0),
allow_card boolean not null default true, allow_ach boolean not null default false,
allow_manual boolean not null default false, allow_terms boolean not null default false,
release_policy text not null default 'PAYMENT_SUCCEEDED' check (release_policy in ('PAYMENT_SUCCEEDED','APPROVED_CREDIT')),
version bigint not null default 1,
check (not allow_terms or payment_terms_days > 0),
check (release_policy <> 'APPROVED_CREDIT' or allow_terms)
);
ALTER TABLE public.company_commerce_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_commerce_policies FROM anon, authenticated;

CREATE TABLE public.company_addresses (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
label text not null, contact_name text not null, phone text,
line1 text not null, line2 text, city text not null, region text not null,
postal_code text not null, country_code text not null default 'US' check (country_code = 'US'),
is_billing boolean not null default false, is_default_shipping boolean not null default false,
archived_at timestamptz, unique (id, company_id)
);
ALTER TABLE public.company_addresses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_addresses FROM anon, authenticated;

CREATE TABLE public.company_locations (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
address_id uuid not null, name text not null,
is_residential boolean not null default false, has_dock boolean not null default false,
liftgate_required boolean not null default false, appointment_required boolean not null default false,
receiving_instructions text, active boolean not null default true,
unique (id, company_id),
foreign key (address_id, company_id) references public.company_addresses(id, company_id)
);
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_locations FROM anon, authenticated;

CREATE TABLE public.wholesale_applications (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
first_name text not null, last_name text not null,
business_name text not null, email text not null, phone text not null,
website text, business_type text not null, address jsonb not null,
business_number text, estimated_monthly_volume text, products_interested_in text[] not null default '{}',
applicant_notes text,
status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','SUSPENDED')),
company_id uuid references public.companies(id),
reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
internal_notes text, customer_message text, submission_key uuid not null unique,
check (status <> 'APPROVED' or (company_id is not null and reviewed_by is not null and reviewed_at is not null))
);
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wholesale_applications FROM anon, authenticated;

CREATE TABLE public.company_invitations (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
email text not null, role text not null check (role in ('OWNER','BUYER','VIEWER')),
token_hash text not null unique, expires_at timestamptz not null,
invited_by uuid references public.profiles(id), accepted_by uuid references public.profiles(id),
accepted_at timestamptz, revoked_at timestamptz,
check (expires_at > created_at)
);
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_invitations FROM anon, authenticated;

CREATE TABLE public.tax_exemptions (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
jurisdiction text not null, certificate_storage_path text not null,
status text not null default 'PENDING' check (status in ('PENDING','VERIFIED','REJECTED','EXPIRED')),
valid_from date, valid_until date, verified_by uuid references public.profiles(id),
check (valid_until is null or valid_from is null or valid_until >= valid_from)
);
ALTER TABLE public.tax_exemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tax_exemptions FROM anon, authenticated;

CREATE TABLE public.product_categories (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
name text not null, slug text not null unique,
parent_id uuid references public.product_categories(id), sort_order integer not null default 0,
active boolean not null default true, check (parent_id is null or parent_id <> id)
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_categories FROM anon, authenticated;

CREATE TABLE public.products (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
shopify_product_id text, shopify_variant_id text unique,
sku text not null unique, name text not null, slug text not null unique,
description text not null default '', image_url text,
category_id uuid references public.product_categories(id),
wholesale_name_override text, wholesale_description_override text,
active boolean not null default true, wholesale_enabled boolean not null default false,
base_unit text not null check (base_unit in ('EACH','G','ML')),
ingredients text, allergens text, storage_requirements text, shelf_life_days integer check (shelf_life_days > 0),
country_of_origin text, source_updated_at timestamptz, synced_at timestamptz,
version bigint not null default 1
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.products FROM anon, authenticated;

CREATE TABLE public.product_packaging (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
product_id uuid not null references public.products(id),
name text not null, type text not null check (type in ('UNIT','CASE','BOX','BAG','PALLET','KG','LB')),
sku text not null unique, barcode text unique,
base_unit_quantity numeric(18,6) not null check (base_unit_quantity > 0),
weight_g numeric(18,3) check (weight_g > 0),
weight_basis text not null default 'GROSS' check (weight_basis in ('NET','GROSS')),
length_mm numeric(12,3) check (length_mm > 0), width_mm numeric(12,3) check (width_mm > 0), height_mm numeric(12,3) check (height_mm > 0),
minimum_quantity numeric(18,6) not null default 1 check (minimum_quantity > 0),
maximum_quantity numeric(18,6), quantity_increment numeric(18,6) not null default 1 check (quantity_increment > 0),
freight_class text, nmfc text, active boolean not null default true,
unique (id, product_id),
check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
check (mod(minimum_quantity, quantity_increment) = 0),
check (type not in ('UNIT','CASE','BOX','BAG','PALLET') or (quantity_increment = trunc(quantity_increment) and minimum_quantity = trunc(minimum_quantity)))
);
ALTER TABLE public.product_packaging ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_packaging FROM anon, authenticated;

CREATE TABLE public.price_lists (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
name text not null, currency text not null default 'USD' check (currency = 'USD'),
scope text not null check (scope in ('DEFAULT','TIER','COMPANY')),
pricing_tier_id uuid references public.pricing_tiers(id), active boolean not null default true,
version bigint not null default 1,
check ((scope = 'TIER' and pricing_tier_id is not null) or (scope <> 'TIER' and pricing_tier_id is null))
);
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.price_lists FROM anon, authenticated;

CREATE TABLE public.company_price_lists (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
price_list_id uuid not null references public.price_lists(id),
currency text not null default 'USD' check (currency = 'USD'),
unique (company_id, currency)
);
ALTER TABLE public.company_price_lists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_price_lists FROM anon, authenticated;

CREATE TABLE public.price_list_items (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
price_list_id uuid not null references public.price_lists(id),
packaging_id uuid not null references public.product_packaging(id),
unit_price_minor bigint not null check (unit_price_minor >= 0),
unique (price_list_id, packaging_id)
);
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.price_list_items FROM anon, authenticated;

CREATE TABLE public.quantity_price_breaks (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
price_list_item_id uuid not null references public.price_list_items(id),
minimum_quantity numeric(18,6) not null check (minimum_quantity > 0),
unit_price_minor bigint not null check (unit_price_minor >= 0),
unique (price_list_item_id, minimum_quantity)
);
ALTER TABLE public.quantity_price_breaks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quantity_price_breaks FROM anon, authenticated;

CREATE TABLE public.customer_price_overrides (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
packaging_id uuid not null references public.product_packaging(id),
currency text not null default 'USD' check (currency = 'USD'),
unit_price_minor bigint not null check (unit_price_minor >= 0), active boolean not null default true,
reason text not null, version bigint not null default 1
);
ALTER TABLE public.customer_price_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_price_overrides FROM anon, authenticated;

CREATE TABLE public.inventory_locations (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
name text not null, external_location_id text unique,
source text not null check (source in ('SHOPIFY','WHOLESALE_ALLOCATION')), active boolean not null default true
);
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_locations FROM anon, authenticated;

CREATE TABLE public.inventory_balances (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
product_id uuid not null references public.products(id),
inventory_location_id uuid not null references public.inventory_locations(id),
on_hand_base_units numeric(18,6) not null check (on_hand_base_units >= 0),
safety_stock_base_units numeric(18,6) not null default 0 check (safety_stock_base_units >= 0),
source_updated_at timestamptz not null,
unique (product_id, inventory_location_id)
);
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_balances FROM anon, authenticated;

CREATE TABLE public.carts (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
created_by_membership_id uuid not null, location_id uuid,
status text not null default 'ACTIVE' check (status in ('ACTIVE','CONVERTED','ABANDONED')),
currency text not null default 'USD' check (currency = 'USD'), version bigint not null default 1,
unique (id, company_id),
foreign key (created_by_membership_id, company_id) references public.company_users(id, company_id),
foreign key (location_id, company_id) references public.company_locations(id, company_id)
);
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.carts FROM anon, authenticated;

CREATE TABLE public.cart_items (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
cart_id uuid not null references public.carts(id),
packaging_id uuid not null references public.product_packaging(id),
quantity numeric(18,6) not null check (quantity > 0), unique (cart_id, packaging_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cart_items FROM anon, authenticated;

CREATE TABLE public.checkout_quotes (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id), cart_id uuid not null,
cart_version bigint not null, fingerprint text not null,
pricing_snapshot jsonb not null, address_snapshot jsonb not null, shipping_snapshot jsonb not null, tax_snapshot jsonb not null,
subtotal_minor bigint not null check (subtotal_minor >= 0), shipping_minor bigint not null check (shipping_minor >= 0),
tax_minor bigint not null check (tax_minor >= 0), discount_minor bigint not null default 0 check (discount_minor >= 0),
total_minor bigint not null check (total_minor >= 0), currency text not null default 'USD' check (currency = 'USD'),
expires_at timestamptz not null, unique (id, company_id),
foreign key (cart_id, company_id) references public.carts(id, company_id),
check (total_minor = subtotal_minor + shipping_minor + tax_minor - discount_minor)
);
ALTER TABLE public.checkout_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_quotes FROM anon, authenticated;

CREATE TABLE public.orders (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_number text not null unique,
company_id uuid not null references public.companies(id), placed_by_membership_id uuid not null,
quote_id uuid not null unique, cart_id uuid not null unique,
status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','PROCESSING','READY_TO_SHIP','SHIPPED','DELIVERED','CANCELLED','ON_HOLD')),
payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID','PROCESSING','AUTHORIZED','PAID','PARTIALLY_PAID','REFUNDED','PARTIALLY_REFUNDED','DISPUTED')),
fulfillment_status text not null default 'UNFULFILLED' check (fulfillment_status in ('UNFULFILLED','PARTIALLY_FULFILLED','FULFILLED')),
fulfillment_hold_reason text,
subtotal_minor bigint not null check (subtotal_minor >= 0), shipping_minor bigint not null check (shipping_minor >= 0),
tax_minor bigint not null check (tax_minor >= 0), discount_minor bigint not null default 0 check (discount_minor >= 0),
total_minor bigint not null check (total_minor >= 0), currency text not null default 'USD' check (currency = 'USD'),
billing_address_snapshot jsonb not null, shipping_address_snapshot jsonb not null,
customer_po_number text, customer_notes text, payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
payment_due_at timestamptz, settings_snapshot jsonb not null,
idempotency_key uuid not null, version bigint not null default 1,
unique (company_id, idempotency_key), unique (id, company_id),
foreign key (placed_by_membership_id, company_id) references public.company_users(id, company_id),
foreign key (quote_id, company_id) references public.checkout_quotes(id, company_id),
foreign key (cart_id, company_id) references public.carts(id, company_id),
check (total_minor = subtotal_minor + shipping_minor + tax_minor - discount_minor)
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders FROM anon, authenticated;

CREATE TABLE public.order_items (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id),
product_id uuid not null references public.products(id), packaging_id uuid not null,
sku text not null, product_name text not null, packaging_name text not null, packaging_type text not null,
base_unit_quantity numeric(18,6) not null check (base_unit_quantity > 0),
quantity numeric(18,6) not null check (quantity > 0),
unit_price_minor bigint not null check (unit_price_minor >= 0),
subtotal_minor bigint not null check (subtotal_minor >= 0),
discount_minor bigint not null default 0 check (discount_minor >= 0), tax_minor bigint not null check (tax_minor >= 0),
total_minor bigint not null check (total_minor >= 0),
pricing_snapshot jsonb not null, tax_snapshot jsonb not null, packaging_snapshot jsonb not null,
weight_g numeric(18,3) check (weight_g > 0), dimensions_snapshot jsonb,
unique (id, order_id),
foreign key (packaging_id, product_id) references public.product_packaging(id, product_id),
check (subtotal_minor = round(quantity * unit_price_minor)),
check (total_minor = subtotal_minor - discount_minor + tax_minor)
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_items FROM anon, authenticated;

CREATE TABLE public.order_status_history (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id),
axis text not null check (axis in ('ORDER','PAYMENT','FULFILLMENT')),
previous_status text, new_status text not null,
actor_id uuid references public.profiles(id), customer_message text, internal_reason text,
source_event_id text
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_status_history FROM anon, authenticated;

CREATE TABLE public.inventory_reservations (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id), order_item_id uuid not null,
inventory_balance_id uuid not null references public.inventory_balances(id),
base_units numeric(18,6) not null check (base_units > 0),
status text not null default 'ACTIVE' check (status in ('ACTIVE','COMMITTED','RELEASED','EXPIRED')),
expires_at timestamptz not null,
foreign key (order_item_id, order_id) references public.order_items(id, order_id),
unique (order_item_id, inventory_balance_id)
);
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_reservations FROM anon, authenticated;

CREATE TABLE public.integration_accounts (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
provider text not null check (provider in ('STRIPE','SHOPIFY','SHIPSTATION','CHROBINSON','EMAIL','TAX')),
name text not null, mode text not null check (mode in ('TEST','LIVE')),
external_account_id text, secret_reference text, configuration jsonb not null default '{}',
status text not null default 'DISCONNECTED' check (status in ('DISCONNECTED','CONNECTED','ERROR','DISABLED')),
last_verified_at timestamptz, unique (provider, name, mode)
);
ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_accounts FROM anon, authenticated;

CREATE TABLE public.company_payment_accounts (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
integration_account_id uuid not null references public.integration_accounts(id),
external_customer_id text not null,
unique (company_id, integration_account_id), unique (integration_account_id, external_customer_id), unique (id, company_id)
);
ALTER TABLE public.company_payment_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_payment_accounts FROM anon, authenticated;

CREATE TABLE public.payment_methods (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id), payment_account_id uuid not null,
external_method_id text not null, external_mandate_id text,
type text not null check (type in ('CARD','US_BANK_ACCOUNT')),
brand_or_bank text, last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
status text not null check (status in ('PENDING','VERIFIED','BLOCKED','DETACHED')),
consented_at timestamptz, unique (payment_account_id, external_method_id), unique (id, company_id),
foreign key (payment_account_id, company_id) references public.company_payment_accounts(id, company_id)
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_methods FROM anon, authenticated;

CREATE TABLE public.payments (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id), order_id uuid not null,
payment_account_id uuid not null, payment_method_id uuid,
external_payment_id text, external_checkout_session_id text,
idempotency_key uuid not null unique,
method text not null check (method in ('CARD','US_BANK_ACCOUNT')),
status text not null default 'CREATED' check (status in ('CREATED','REQUIRES_ACTION','PROCESSING','SUCCEEDED','FAILED','CANCELLED')),
amount_minor bigint not null check (amount_minor > 0), currency text not null default 'USD' check (currency = 'USD'),
captured_minor bigint not null default 0 check (captured_minor >= 0), failure_code text,
provider_updated_at timestamptz, unique (payment_account_id, external_payment_id), unique (id, company_id),
foreign key (order_id, company_id) references public.orders(id, company_id),
foreign key (payment_account_id, company_id) references public.company_payment_accounts(id, company_id),
foreign key (payment_method_id, company_id) references public.payment_methods(id, company_id),
check (captured_minor <= amount_minor)
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM anon, authenticated;

CREATE TABLE public.refunds (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
payment_id uuid not null references public.payments(id),
external_refund_id text unique, idempotency_key uuid not null unique,
amount_minor bigint not null check (amount_minor > 0),
status text not null default 'PENDING' check (status in ('PENDING','SUCCEEDED','FAILED','CANCELLED')),
reason text not null, requested_by uuid not null references public.profiles(id)
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.refunds FROM anon, authenticated;

CREATE TABLE public.payment_disputes (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
payment_id uuid not null references public.payments(id),
external_dispute_id text not null unique, amount_minor bigint not null check (amount_minor > 0),
status text not null, reason text, evidence_due_at timestamptz, resolved_at timestamptz
);
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_disputes FROM anon, authenticated;

CREATE TABLE public.shipping_rules (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
name text not null, priority integer not null unique,
conditions jsonb not null, method text not null check (method in ('PARCEL','LTL','FREIGHT','LOCAL_PICKUP','MANUAL_QUOTE')),
provider text, service_code text, configuration jsonb not null default '{}',
active boolean not null default true, version bigint not null default 1
);
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipping_rules FROM anon, authenticated;

CREATE TABLE public.shipping_rates (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id), cart_id uuid not null,
integration_account_id uuid references public.integration_accounts(id),
external_rate_id text, carrier text, service text,
method text not null check (method in ('PARCEL','LTL','FREIGHT','LOCAL_PICKUP','MANUAL_QUOTE')),
amount_minor bigint not null check (amount_minor >= 0), currency text not null default 'USD' check (currency = 'USD'),
cart_fingerprint text not null, destination_fingerprint text not null,
package_snapshot jsonb not null, rule_snapshot jsonb not null, expires_at timestamptz not null,
foreign key (cart_id, company_id) references public.carts(id, company_id)
);
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipping_rates FROM anon, authenticated;

CREATE TABLE public.shipments (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id),
integration_account_id uuid references public.integration_accounts(id),
external_shipment_id text, idempotency_key uuid not null unique,
method text not null check (method in ('PARCEL','LTL','FREIGHT','LOCAL_PICKUP')),
status text not null default 'PENDING' check (status in ('PENDING','BOOKED','LABEL_CREATED','SHIPPED','DELIVERED','EXCEPTION','CANCELLED')),
carrier text, service text, tracking_number text,
product_weight_g numeric(18,3) not null check (product_weight_g >= 0),
shipment_weight_g numeric(18,3) not null check (shipment_weight_g >= product_weight_g),
shipping_cost_minor bigint check (shipping_cost_minor >= 0),
currency text not null default 'USD' check (currency = 'USD'),
freight_snapshot jsonb, destination_snapshot jsonb not null,
shipped_at timestamptz, delivered_at timestamptz,
unique (integration_account_id, external_shipment_id), unique (id, order_id)
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipments FROM anon, authenticated;

CREATE TABLE public.shipment_packages (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
shipment_id uuid not null references public.shipments(id),
package_type text not null, weight_g numeric(18,3) not null check (weight_g > 0),
length_mm numeric(12,3) not null check (length_mm > 0), width_mm numeric(12,3) not null check (width_mm > 0), height_mm numeric(12,3) not null check (height_mm > 0),
tracking_number text, label_storage_path text, freight_class text, nmfc text
);
ALTER TABLE public.shipment_packages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipment_packages FROM anon, authenticated;

CREATE TABLE public.shipment_items (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
shipment_id uuid not null, order_id uuid not null,
order_item_id uuid not null, quantity numeric(18,6) not null check (quantity > 0),
foreign key (shipment_id, order_id) references public.shipments(id, order_id),
foreign key (order_item_id, order_id) references public.order_items(id, order_id),
unique (shipment_id, order_item_id)
);
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipment_items FROM anon, authenticated;

CREATE TABLE public.order_documents (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id),
type text not null check (type in ('INVOICE','PACKING_SLIP','CREDIT_NOTE','OTHER')),
storage_path text not null, display_name text not null,
customer_visible boolean not null default false
);
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_documents FROM anon, authenticated;

CREATE TABLE public.order_external_references (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
order_id uuid not null references public.orders(id),
integration_account_id uuid not null references public.integration_accounts(id),
external_id text not null, purpose text not null,
unique (integration_account_id, external_id, purpose), unique (order_id, integration_account_id, purpose)
);
ALTER TABLE public.order_external_references ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_external_references FROM anon, authenticated;

CREATE TABLE public.integration_events (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
integration_account_id uuid not null references public.integration_accounts(id),
provider_event_id text not null, event_type text not null, payload jsonb not null,
status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','PROCESSED','FAILED','DEAD_LETTER')),
provider_created_at timestamptz, received_at timestamptz not null default now(),
processed_at timestamptz, attempts integer not null default 0 check (attempts >= 0),
next_attempt_at timestamptz not null default now(), lease_until timestamptz, error_code text,
unique (integration_account_id, provider_event_id)
);
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_events FROM anon, authenticated;

CREATE TABLE public.outbox_events (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
event_type text not null, aggregate_type text not null, aggregate_id uuid not null,
payload jsonb not null, dedupe_key text not null unique,
status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','PROCESSED','FAILED','DEAD_LETTER')),
attempts integer not null default 0 check (attempts >= 0), next_attempt_at timestamptz not null default now(),
lease_until timestamptz, processed_at timestamptz, error_code text
);
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.outbox_events FROM anon, authenticated;

CREATE TABLE public.sync_jobs (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
integration_account_id uuid not null references public.integration_accounts(id),
operation text not null, status text not null check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
checkpoint jsonb, started_at timestamptz, completed_at timestamptz,
records_processed integer not null default 0 check (records_processed >= 0), error_code text
);
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sync_jobs FROM anon, authenticated;

CREATE TABLE public.integration_logs (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
integration_account_id uuid not null references public.integration_accounts(id),
sync_job_id uuid references public.sync_jobs(id), event_id uuid references public.integration_events(id),
action text not null, status text not null, request_id text, external_id text,
error_code text, safe_message text, duration_ms integer check (duration_ms >= 0)
);
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_logs FROM anon, authenticated;

CREATE TABLE public.audit_logs (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
actor_id uuid references public.profiles(id), actor_type text not null check (actor_type in ('USER','SYSTEM')),
action text not null, entity_type text not null, entity_id uuid not null,
previous_value jsonb, new_value jsonb, request_id text, reason text
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;

CREATE TABLE public.settings (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
namespace text not null, key text not null, value jsonb not null,
schema_version integer not null default 1 check (schema_version > 0),
version bigint not null default 1, updated_by uuid references public.profiles(id), unique (namespace, key)
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.settings FROM anon, authenticated;

CREATE TABLE public.user_preferences (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
user_id uuid not null references public.profiles(id),
key text not null, value jsonb not null, unique (user_id, key)
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_preferences FROM anon, authenticated;

CREATE TABLE public.notification_templates (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
event_type text not null, locale text not null default 'en-US',
subject text not null, body_template text not null, active boolean not null default true,
version bigint not null default 1, unique (event_type, locale)
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_templates FROM anon, authenticated;

CREATE TABLE public.notification_deliveries (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
outbox_event_id uuid not null references public.outbox_events(id),
template_id uuid references public.notification_templates(id), recipient_user_id uuid references public.profiles(id),
recipient_email text not null, external_message_id text,
status text not null default 'PENDING' check (status in ('PENDING','SENT','DELIVERED','FAILED','BOUNCED')),
dedupe_key text not null unique, attempts integer not null default 0 check (attempts >= 0),
sent_at timestamptz, error_code text
);
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_deliveries FROM anon, authenticated;

CREATE TABLE public.idempotency_records (
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
company_id uuid not null references public.companies(id),
operation text not null, key uuid not null, request_hash text not null,
status text not null check (status in ('IN_PROGRESS','SUCCEEDED','FAILED')),
resource_id uuid, expires_at timestamptz not null, unique (company_id, operation, key)
);
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.idempotency_records FROM anon, authenticated;


-- Constraints that apply only to active records.
CREATE UNIQUE INDEX company_default_billing ON public.company_addresses(company_id) WHERE is_billing AND archived_at IS NULL;
CREATE UNIQUE INDEX company_default_shipping ON public.company_addresses(company_id) WHERE is_default_shipping AND archived_at IS NULL;
CREATE UNIQUE INDEX active_default_price_list ON public.price_lists(currency) WHERE active AND scope = 'DEFAULT';
CREATE UNIQUE INDEX active_tier_price_list ON public.price_lists(pricing_tier_id, currency) WHERE active AND scope = 'TIER';
CREATE UNIQUE INDEX active_company_override ON public.customer_price_overrides(company_id, packaging_id, currency) WHERE active;
CREATE UNIQUE INDEX pending_invitation ON public.company_invitations(company_id, lower(email)) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX product_shopify_product ON public.products(shopify_product_id);
CREATE INDEX application_email ON public.wholesale_applications(lower(email));
CREATE INDEX application_status_created ON public.wholesale_applications(status, created_at);
CREATE INDEX company_email ON public.companies(lower(email));
CREATE INDEX company_status ON public.companies(status);
CREATE INDEX profile_email ON public.profiles(lower(email));
CREATE INDEX order_company_created ON public.orders(company_id, created_at DESC);
CREATE INDEX order_status_created ON public.orders(status, created_at DESC);
CREATE INDEX order_payment_status ON public.orders(payment_status);
CREATE INDEX order_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX outbox_ready ON public.outbox_events(next_attempt_at) WHERE status IN ('PENDING','FAILED');
CREATE INDEX inbox_ready ON public.integration_events(next_attempt_at) WHERE status IN ('PENDING','FAILED');
CREATE INDEX reservation_expiry ON public.inventory_reservations(expires_at) WHERE status = 'ACTIVE';
CREATE INDEX audit_entity_time ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX integration_log_time ON public.integration_logs(integration_account_id, created_at DESC);

CREATE INDEX staff_role_permissions_permission_id_idx ON public.staff_role_permissions(permission_id);

CREATE INDEX staff_role_permissions_role_id_idx ON public.staff_role_permissions(role_id);

CREATE INDEX staff_users_role_id_idx ON public.staff_users(role_id);

CREATE INDEX staff_users_user_id_idx ON public.staff_users(user_id);

CREATE INDEX companies_pricing_tier_id_idx ON public.companies(pricing_tier_id);

CREATE INDEX company_users_company_id_idx ON public.company_users(company_id);

CREATE INDEX company_users_user_id_idx ON public.company_users(user_id);

CREATE INDEX company_private_details_company_id_idx ON public.company_private_details(company_id);

CREATE INDEX company_commerce_policies_company_id_idx ON public.company_commerce_policies(company_id);

CREATE INDEX company_addresses_company_id_idx ON public.company_addresses(company_id);

CREATE INDEX company_locations_address_id_idx ON public.company_locations(address_id);

CREATE INDEX company_locations_company_id_idx ON public.company_locations(company_id);

CREATE INDEX wholesale_applications_company_id_idx ON public.wholesale_applications(company_id);

CREATE INDEX wholesale_applications_reviewed_by_idx ON public.wholesale_applications(reviewed_by);

CREATE INDEX company_invitations_accepted_by_idx ON public.company_invitations(accepted_by);

CREATE INDEX company_invitations_company_id_idx ON public.company_invitations(company_id);

CREATE INDEX company_invitations_invited_by_idx ON public.company_invitations(invited_by);

CREATE INDEX tax_exemptions_company_id_idx ON public.tax_exemptions(company_id);

CREATE INDEX tax_exemptions_verified_by_idx ON public.tax_exemptions(verified_by);

CREATE INDEX product_categories_parent_id_idx ON public.product_categories(parent_id);

CREATE INDEX products_category_id_idx ON public.products(category_id);

CREATE INDEX product_packaging_product_id_idx ON public.product_packaging(product_id);

CREATE INDEX price_lists_pricing_tier_id_idx ON public.price_lists(pricing_tier_id);

CREATE INDEX company_price_lists_company_id_idx ON public.company_price_lists(company_id);

CREATE INDEX company_price_lists_price_list_id_idx ON public.company_price_lists(price_list_id);

CREATE INDEX price_list_items_packaging_id_idx ON public.price_list_items(packaging_id);

CREATE INDEX price_list_items_price_list_id_idx ON public.price_list_items(price_list_id);

CREATE INDEX quantity_price_breaks_price_list_item_id_idx ON public.quantity_price_breaks(price_list_item_id);

CREATE INDEX customer_price_overrides_company_id_idx ON public.customer_price_overrides(company_id);

CREATE INDEX customer_price_overrides_packaging_id_idx ON public.customer_price_overrides(packaging_id);

CREATE INDEX inventory_balances_inventory_location_id_idx ON public.inventory_balances(inventory_location_id);

CREATE INDEX inventory_balances_product_id_idx ON public.inventory_balances(product_id);

CREATE INDEX carts_company_id_idx ON public.carts(company_id);

CREATE INDEX carts_created_by_membership_id_idx ON public.carts(created_by_membership_id);

CREATE INDEX carts_location_id_idx ON public.carts(location_id);

CREATE INDEX cart_items_cart_id_idx ON public.cart_items(cart_id);

CREATE INDEX cart_items_packaging_id_idx ON public.cart_items(packaging_id);

CREATE INDEX checkout_quotes_cart_id_idx ON public.checkout_quotes(cart_id);

CREATE INDEX checkout_quotes_company_id_idx ON public.checkout_quotes(company_id);

CREATE INDEX orders_cart_id_idx ON public.orders(cart_id);

CREATE INDEX orders_company_id_idx ON public.orders(company_id);

CREATE INDEX orders_placed_by_membership_id_idx ON public.orders(placed_by_membership_id);

CREATE INDEX orders_quote_id_idx ON public.orders(quote_id);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

CREATE INDEX order_items_packaging_id_idx ON public.order_items(packaging_id);

CREATE INDEX order_items_product_id_idx ON public.order_items(product_id);

CREATE INDEX order_status_history_actor_id_idx ON public.order_status_history(actor_id);

CREATE INDEX order_status_history_order_id_idx ON public.order_status_history(order_id);

CREATE INDEX inventory_reservations_inventory_balance_id_idx ON public.inventory_reservations(inventory_balance_id);

CREATE INDEX inventory_reservations_order_id_idx ON public.inventory_reservations(order_id);

CREATE INDEX inventory_reservations_order_item_id_idx ON public.inventory_reservations(order_item_id);

CREATE INDEX company_payment_accounts_company_id_idx ON public.company_payment_accounts(company_id);

CREATE INDEX company_payment_accounts_integration_account_id_idx ON public.company_payment_accounts(integration_account_id);

CREATE INDEX payment_methods_company_id_idx ON public.payment_methods(company_id);

CREATE INDEX payment_methods_payment_account_id_idx ON public.payment_methods(payment_account_id);

CREATE INDEX payments_company_id_idx ON public.payments(company_id);

CREATE INDEX payments_order_id_idx ON public.payments(order_id);

CREATE INDEX payments_payment_account_id_idx ON public.payments(payment_account_id);

CREATE INDEX payments_payment_method_id_idx ON public.payments(payment_method_id);

CREATE INDEX refunds_payment_id_idx ON public.refunds(payment_id);

CREATE INDEX refunds_requested_by_idx ON public.refunds(requested_by);

CREATE INDEX payment_disputes_payment_id_idx ON public.payment_disputes(payment_id);

CREATE INDEX shipping_rates_cart_id_idx ON public.shipping_rates(cart_id);

CREATE INDEX shipping_rates_company_id_idx ON public.shipping_rates(company_id);

CREATE INDEX shipping_rates_integration_account_id_idx ON public.shipping_rates(integration_account_id);

CREATE INDEX shipments_integration_account_id_idx ON public.shipments(integration_account_id);

CREATE INDEX shipments_order_id_idx ON public.shipments(order_id);

CREATE INDEX shipment_packages_shipment_id_idx ON public.shipment_packages(shipment_id);

CREATE INDEX shipment_items_order_item_id_idx ON public.shipment_items(order_item_id);

CREATE INDEX shipment_items_shipment_id_idx ON public.shipment_items(shipment_id);

CREATE INDEX order_documents_order_id_idx ON public.order_documents(order_id);

CREATE INDEX order_external_references_integration_account_id_idx ON public.order_external_references(integration_account_id);

CREATE INDEX order_external_references_order_id_idx ON public.order_external_references(order_id);

CREATE INDEX integration_events_integration_account_id_idx ON public.integration_events(integration_account_id);

CREATE INDEX sync_jobs_integration_account_id_idx ON public.sync_jobs(integration_account_id);

CREATE INDEX integration_logs_event_id_idx ON public.integration_logs(event_id);

CREATE INDEX integration_logs_integration_account_id_idx ON public.integration_logs(integration_account_id);

CREATE INDEX integration_logs_sync_job_id_idx ON public.integration_logs(sync_job_id);

CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs(actor_id);

CREATE INDEX settings_updated_by_idx ON public.settings(updated_by);

CREATE INDEX user_preferences_user_id_idx ON public.user_preferences(user_id);

CREATE INDEX notification_deliveries_outbox_event_id_idx ON public.notification_deliveries(outbox_event_id);

CREATE INDEX notification_deliveries_recipient_user_id_idx ON public.notification_deliveries(recipient_user_id);

CREATE INDEX notification_deliveries_template_id_idx ON public.notification_deliveries(template_id);

CREATE INDEX idempotency_records_company_id_idx ON public.idempotency_records(company_id);


-- updated_at is maintained consistently; append-only records cannot be modified.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
CREATE FUNCTION private.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE FUNCTION private.reject_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION 'Immutable record: %', TG_TABLE_NAME; END;
$$;
REVOKE ALL ON FUNCTION private.touch_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.reject_mutation() FROM PUBLIC;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER staff_roles_updated_at BEFORE UPDATE ON public.staff_roles FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER staff_role_permissions_updated_at BEFORE UPDATE ON public.staff_role_permissions FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER staff_users_updated_at BEFORE UPDATE ON public.staff_users FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER pricing_tiers_updated_at BEFORE UPDATE ON public.pricing_tiers FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_users_updated_at BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_private_details_updated_at BEFORE UPDATE ON public.company_private_details FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_commerce_policies_updated_at BEFORE UPDATE ON public.company_commerce_policies FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_addresses_updated_at BEFORE UPDATE ON public.company_addresses FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_locations_updated_at BEFORE UPDATE ON public.company_locations FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER wholesale_applications_updated_at BEFORE UPDATE ON public.wholesale_applications FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_invitations_updated_at BEFORE UPDATE ON public.company_invitations FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER tax_exemptions_updated_at BEFORE UPDATE ON public.tax_exemptions FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER product_packaging_updated_at BEFORE UPDATE ON public.product_packaging FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER price_lists_updated_at BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_price_lists_updated_at BEFORE UPDATE ON public.company_price_lists FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER price_list_items_updated_at BEFORE UPDATE ON public.price_list_items FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER quantity_price_breaks_updated_at BEFORE UPDATE ON public.quantity_price_breaks FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER customer_price_overrides_updated_at BEFORE UPDATE ON public.customer_price_overrides FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER inventory_locations_updated_at BEFORE UPDATE ON public.inventory_locations FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER inventory_balances_updated_at BEFORE UPDATE ON public.inventory_balances FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER checkout_quotes_updated_at BEFORE UPDATE ON public.checkout_quotes FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER order_items_immutable BEFORE UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION private.reject_mutation();

CREATE TRIGGER order_status_history_immutable BEFORE UPDATE OR DELETE ON public.order_status_history FOR EACH ROW EXECUTE FUNCTION private.reject_mutation();

CREATE TRIGGER inventory_reservations_updated_at BEFORE UPDATE ON public.inventory_reservations FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER integration_accounts_updated_at BEFORE UPDATE ON public.integration_accounts FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_payment_accounts_updated_at BEFORE UPDATE ON public.company_payment_accounts FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER refunds_updated_at BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER payment_disputes_updated_at BEFORE UPDATE ON public.payment_disputes FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER shipping_rules_updated_at BEFORE UPDATE ON public.shipping_rules FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER shipment_packages_updated_at BEFORE UPDATE ON public.shipment_packages FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER shipment_items_updated_at BEFORE UPDATE ON public.shipment_items FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER order_documents_updated_at BEFORE UPDATE ON public.order_documents FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER order_external_references_updated_at BEFORE UPDATE ON public.order_external_references FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER integration_events_updated_at BEFORE UPDATE ON public.integration_events FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER outbox_events_updated_at BEFORE UPDATE ON public.outbox_events FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER sync_jobs_updated_at BEFORE UPDATE ON public.sync_jobs FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER integration_logs_immutable BEFORE UPDATE OR DELETE ON public.integration_logs FOR EACH ROW EXECUTE FUNCTION private.reject_mutation();

CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION private.reject_mutation();

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER notification_deliveries_updated_at BEFORE UPDATE ON public.notification_deliveries FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER idempotency_records_updated_at BEFORE UPDATE ON public.idempotency_records FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

COMMIT;
