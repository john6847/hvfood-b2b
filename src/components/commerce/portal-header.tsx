import Link from "next/link";
import { LogOut, ShoppingCart, Zap } from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import type { Membership } from "@/modules/identity/company-access";
import { CompanySwitcher } from "./company-switcher";
import { PortalNav } from "./portal-nav";

type Props = {
  memberships: readonly Membership[];
  active: Membership | null;
  personName: string;
  approved: boolean;
};

/**
 * Compact two-row header from the preview: identity row (wordmark,
 * company switcher, account) and a nav row (Shop, Buy again, Saved lists,
 * Orders, Quick order, Cart). Cart and search arrive with the catalog phase.
 */
export function PortalHeader({ memberships, active, personName, approved }: Props) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Wordmark href="/wholesale/dashboard" />
        <div className="flex flex-wrap items-center gap-3">
          <CompanySwitcher memberships={memberships} active={active} />
          <div className="flex items-center gap-3 border-l border-border pl-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-2xs uppercase tracking-wider text-foreground-muted">Signed in as</p>
              <p className="text-sm font-medium text-foreground">{personName}</p>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                <LogOut aria-hidden />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-(--content-max) items-center justify-between gap-4 px-6">
          <PortalNav approved={approved} />
          {approved ? (
            <div className="hidden items-center gap-2 py-2 sm:flex">
              <Link
                href="/wholesale/quick-order"
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Zap aria-hidden className="size-4" />
                Quick order
              </Link>
              <span
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground-muted"
                title="Cart opens with the catalog release"
              >
                <ShoppingCart aria-hidden className="size-4" />
                Cart
                <span className="rounded-sm bg-muted px-1.5 text-xs">0</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
