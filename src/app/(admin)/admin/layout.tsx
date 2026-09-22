import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { STATIC_PREVIEW } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { visibleAdminNavigation } from "@/modules/identity/permissions";
import { getCurrentUser, getProfile, getStaffContext } from "@/modules/identity/service";

/**
 * Admin shell. Requires an active staff record, plus an MFA-verified
 * session whenever the database policy switch requires one.
 * Pages call guardPermission() on top of this for their own section.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  const staff = await getStaffContext();
  if (!staff) redirect("/wholesale/dashboard");
  if (staff.mfaRequired && !staff.mfaVerified) redirect("/mfa");

  const profile = await getProfile();
  const staffName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Staff";
  const items = visibleAdminNavigation(staff.permissions).map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <AdminSidebar items={items} staffName={staffName} roleName={staff.roleName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-6 sm:py-3">
          {STATIC_PREVIEW ? (
            <p className="text-xs text-foreground-muted">
              Sample operations data. Staff roles and two-step verification activate with the database.
            </p>
          ) : staff.mfaVerified ? (
            <p className="flex items-center gap-2 text-xs text-foreground-muted">
              <ShieldCheck className="size-3.5 text-brand-green" aria-hidden />
              Two-step verified session
            </p>
          ) : (
            <Link
              href="/mfa?setup=1"
              className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Two-step verification is optional right now. Set it up
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-(--content-max)">{children}</div>
        </main>
      </div>
    </div>
  );
}
