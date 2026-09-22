/**
 * Staff permission codes. The database is the source of truth
 * (see supabase/migrations/*_reference_data.sql); this list mirrors it so
 * server code gets type checking on permission names.
 */
export const PERMISSION_CODES = [
  "accounts.read",
  "accounts.manage",
  "applications.review",
  "catalog.read",
  "catalog.manage",
  "pricing.read",
  "pricing.manage",
  "orders.read",
  "orders.manage",
  "orders.assist",
  "fulfillment.manage",
  "finance.read",
  "finance.manage",
  "integrations.manage",
  "settings.manage",
  "staff.manage",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSION_CODES)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSION_CODES as readonly string[]).includes(value);
}

/** True when the granted set contains the required permission. */
export function hasPermission(
  granted: readonly string[],
  required: Permission,
): boolean {
  return granted.includes(required);
}

/** True when the granted set contains at least one of the alternatives. */
export function hasAnyPermission(
  granted: readonly string[],
  alternatives: readonly Permission[],
): boolean {
  return alternatives.some((permission) => granted.includes(permission));
}

/**
 * Admin navigation, in the order the blueprint specifies. Each entry names
 * the permissions that make it visible. Visibility is a convenience; the
 * pages themselves call requirePermission again.
 */
export const ADMIN_NAVIGATION: ReadonlyArray<{
  href: string;
  label: string;
  anyOf: readonly Permission[];
}> = [
  { href: "/admin", label: "Home", anyOf: [] },
  { href: "/admin/applications", label: "Applications", anyOf: ["applications.review"] },
  { href: "/admin/orders", label: "Orders", anyOf: ["orders.read"] },
  { href: "/admin/products", label: "Products", anyOf: ["catalog.read"] },
  { href: "/admin/customers", label: "Customers", anyOf: ["accounts.read"] },
  { href: "/admin/pricing", label: "Pricing", anyOf: ["pricing.read"] },
  { href: "/admin/shipping", label: "Shipping", anyOf: ["settings.manage", "fulfillment.manage"] },
  { href: "/admin/integrations", label: "Integrations", anyOf: ["integrations.manage"] },
  { href: "/admin/settings", label: "Settings", anyOf: ["settings.manage", "staff.manage"] },
];

export function visibleAdminNavigation(granted: readonly string[]) {
  return ADMIN_NAVIGATION.filter(
    (item) => item.anyOf.length === 0 || hasAnyPermission(granted, item.anyOf),
  );
}
