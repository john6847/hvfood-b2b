import { PortalFooter } from "@/components/commerce/portal-footer";
import { PortalHeader } from "@/components/commerce/portal-header";
import { PublicHeader } from "@/components/commerce/public-header";
import {
  getActiveMembership,
  getCurrentUser,
  getMemberships,
  getProfile,
} from "@/modules/identity/service";

/**
 * Shell for the product pages, which anyone may browse. Signed-in people
 * get the portal header; visitors get the public one. Whether prices show
 * is decided by each page, not here.
 */
export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  let header = <PublicHeader />;
  if (user) {
    const [profile, memberships, active] = await Promise.all([
      getProfile(),
      getMemberships(),
      getActiveMembership(),
    ]);
    const personName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Account";
    header = (
      <PortalHeader
        memberships={memberships}
        active={active}
        personName={personName}
        approved={active?.companyStatus === "APPROVED"}
      />
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {header}
      <main id="main" className="mx-auto w-full max-w-(--content-max) flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <PortalFooter />
    </div>
  );
}
