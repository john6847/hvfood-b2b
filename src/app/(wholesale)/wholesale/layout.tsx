import { redirect } from "next/navigation";
import { PortalHeader } from "@/components/commerce/portal-header";
import { brand } from "@/config/brand";
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
      <main id="main" className="mx-auto w-full max-w-(--content-max) flex-1 px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-foreground-muted">
          <span>
            {brand.name}. {brand.tagline}
          </span>
          <span>
            {brand.market} · {brand.currency}
          </span>
        </div>
      </footer>
    </div>
  );
}
