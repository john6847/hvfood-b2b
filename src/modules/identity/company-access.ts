/**
 * Pure company-access rules. No I/O, so they are unit tested directly and
 * reused by layouts, actions and later the pricing/catalog services.
 */

export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type CompanyRole = "OWNER" | "BUYER" | "VIEWER";

export type Membership = {
  membershipId: string;
  companyId: string;
  companyDisplayName: string;
  companyStatus: CompanyStatus;
  role: CompanyRole;
};

export type AccessState =
  | "approved" // may browse, see prices and purchase per role
  | "pending" // application under review: no catalog, no prices
  | "suspended" // history only: no prices, no new orders
  | "rejected"
  | "none"; // authenticated but not a member of any company

/** Maps a company status to what the buyer portal may show. */
export function accessStateFor(status: CompanyStatus | null | undefined): AccessState {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "PENDING":
      return "pending";
    case "SUSPENDED":
      return "suspended";
    case "REJECTED":
      return "rejected";
    default:
      return "none";
  }
}

/**
 * Picks the company the session acts in.
 *
 * The preferred id comes from a cookie the user set by switching company.
 * It is only honored when it matches one of the person's current active
 * memberships, so a forged or stale cookie can never select someone else's
 * company. Otherwise the first approved company wins, then the first of any
 * status, then nothing.
 */
export function resolveActiveMembership(
  memberships: readonly Membership[],
  preferredCompanyId: string | null | undefined,
): Membership | null {
  if (memberships.length === 0) return null;

  if (preferredCompanyId) {
    const preferred = memberships.find((m) => m.companyId === preferredCompanyId);
    if (preferred) return preferred;
  }

  const approved = memberships.find((m) => m.companyStatus === "APPROVED");
  return approved ?? memberships[0] ?? null;
}

/** Purchasing is an owner or buyer action; viewers read only. */
export function canPurchase(membership: Membership | null): boolean {
  if (!membership) return false;
  if (membership.companyStatus !== "APPROVED") return false;
  return membership.role === "OWNER" || membership.role === "BUYER";
}

/** Owners manage company details, addresses and employees. */
export function canManageCompany(membership: Membership | null): boolean {
  return membership?.role === "OWNER";
}

/** Wholesale prices are visible only to approved members, whatever the role. */
export function canSeePrices(membership: Membership | null): boolean {
  return membership?.companyStatus === "APPROVED";
}
