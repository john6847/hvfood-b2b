import { redirect } from "next/navigation";
import { PortalFooter } from "@/components/commerce/portal-footer";
import { PortalHeader } from "@/components/commerce/portal-header";
import {
  getActiveMembership,
  getCurrentUser,
  getMemberships,
  getProfile,
} from "@/modules/identity/service";

/**
 * Buyer portal shell. Identity is re-verified here regardless of what the
 * proxy did; the active company is derived from database memberships.
 */
export default async function WholesaleLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wholesale/dashboard");

  const [profile, memberships, active] = await Promise.all([
    getProfile(),
    getMemberships(),
    getActiveMembership(),
  ]);

  const personName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Account";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PortalHeader
        memberships={memberships}
        active={active}
        personName={personName}
        approved={active?.companyStatus === "APPROVED"}
      />
      <main id="main" className="mx-auto w-full max-w-(--content-max) flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <PortalFooter />
    </div>
  );
}
