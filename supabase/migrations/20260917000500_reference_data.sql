-- Phase 1 / reference data required in every environment.
-- Staff roles, permissions and the launch pricing tiers. Idempotent.

insert into public.permissions (code, description) values
  ('accounts.read', 'View companies, memberships, addresses and private company details'),
  ('accounts.manage', 'Edit companies, memberships, addresses, status and tier assignment'),
  ('applications.review', 'Review, approve and reject wholesale applications'),
  ('catalog.read', 'View products, packaging and categories in admin'),
  ('catalog.manage', 'Create and edit products, packaging and categories'),
  ('pricing.read', 'View price lists, tiers, breaks and overrides'),
  ('pricing.manage', 'Edit price lists, tiers, breaks and overrides'),
  ('orders.read', 'View all wholesale orders'),
  ('orders.manage', 'Change order status, notes and holds'),
  ('orders.assist', 'Create carts and orders on behalf of a company'),
  ('fulfillment.manage', 'Create shipments, labels and release fulfillment holds'),
  ('finance.read', 'View payments, credit configuration and commerce policies'),
  ('finance.manage', 'Issue refunds, change terms and credit limits'),
  ('integrations.manage', 'Configure integration accounts and retry failed operations'),
  ('settings.manage', 'Change wholesale, shipping, brand and notification settings'),
  ('staff.manage', 'Assign staff roles and view staff configuration'),
  ('audit.read', 'View audit and integration logs')
on conflict (code) do update set description = excluded.description;

insert into public.staff_roles (code, name) values
  ('ADMINISTRATOR', 'Administrator'),
  ('OPERATIONS', 'Operations'),
  ('CATALOG_MANAGER', 'Catalog manager'),
  ('FINANCE', 'Finance'),
  ('READ_ONLY', 'Read-only staff')
on conflict (code) do update set name = excluded.name;

-- Explicit role mappings. Adding a permission to a role is a migration, so
-- it is reviewed and audited like any other authorization change.
with mapping (role_code, permission_code) as (
  values
    -- Administrator: everything.
    ('ADMINISTRATOR', 'accounts.read'), ('ADMINISTRATOR', 'accounts.manage'),
    ('ADMINISTRATOR', 'applications.review'),
    ('ADMINISTRATOR', 'catalog.read'), ('ADMINISTRATOR', 'catalog.manage'),
    ('ADMINISTRATOR', 'pricing.read'), ('ADMINISTRATOR', 'pricing.manage'),
    ('ADMINISTRATOR', 'orders.read'), ('ADMINISTRATOR', 'orders.manage'), ('ADMINISTRATOR', 'orders.assist'),
    ('ADMINISTRATOR', 'fulfillment.manage'),
    ('ADMINISTRATOR', 'finance.read'), ('ADMINISTRATOR', 'finance.manage'),
    ('ADMINISTRATOR', 'integrations.manage'), ('ADMINISTRATOR', 'settings.manage'),
    ('ADMINISTRATOR', 'staff.manage'), ('ADMINISTRATOR', 'audit.read'),
    -- Operations: accounts, applications, orders, fulfillment.
    ('OPERATIONS', 'accounts.read'), ('OPERATIONS', 'accounts.manage'),
    ('OPERATIONS', 'applications.review'),
    ('OPERATIONS', 'catalog.read'), ('OPERATIONS', 'pricing.read'),
    ('OPERATIONS', 'orders.read'), ('OPERATIONS', 'orders.manage'), ('OPERATIONS', 'orders.assist'),
    ('OPERATIONS', 'fulfillment.manage'),
    -- Catalog manager: catalog and pricing.
    ('CATALOG_MANAGER', 'catalog.read'), ('CATALOG_MANAGER', 'catalog.manage'),
    ('CATALOG_MANAGER', 'pricing.read'), ('CATALOG_MANAGER', 'pricing.manage'),
    ('CATALOG_MANAGER', 'accounts.read'),
    -- Finance: payments, refunds, credit.
    ('FINANCE', 'accounts.read'), ('FINANCE', 'orders.read'),
    ('FINANCE', 'finance.read'), ('FINANCE', 'finance.manage'),
    ('FINANCE', 'pricing.read'), ('FINANCE', 'audit.read'),
    -- Read-only staff: operational reads.
    ('READ_ONLY', 'accounts.read'), ('READ_ONLY', 'catalog.read'),
    ('READ_ONLY', 'pricing.read'), ('READ_ONLY', 'orders.read')
)
insert into public.staff_role_permissions (role_id, permission_id)
select r.id, p.id
from mapping m
join public.staff_roles r on r.code = m.role_code
join public.permissions p on p.code = m.permission_code
on conflict (role_id, permission_id) do nothing;

insert into public.pricing_tiers (code, name) values
  ('STANDARD', 'Standard'),
  ('BRONZE', 'Bronze'),
  ('SILVER', 'Silver'),
  ('GOLD', 'Gold'),
  ('CUSTOM', 'Custom')
on conflict (code) do update set name = excluded.name;
