import "server-only";
import { getActiveMembership, getCurrentUser } from "@/modules/identity/service";

/**
 * Who may see prices. Products are public, but prices belong to a
 * company's price list, so only members of an approved company see them.
 */
export type PriceAccess = "approved" | "pending" | "signed-out";

export async function getPriceAccess(): Promise<PriceAccess> {
  const user = await getCurrentUser();
  if (!user) return "signed-out";
  const membership = await getActiveMembership();
  return membership?.companyStatus === "APPROVED" ? "approved" : "pending";
}
