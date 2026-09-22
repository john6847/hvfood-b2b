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
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Wordmark href="/wholesale/dashboard" />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <CompanySwitcher memberships={memberships} active={active} />
          <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-3 sm:pl-3">
            <div className="hidden text-right leading-tight md:block">
              <p className="text-2xs uppercase tracking-wider text-foreground-muted">Signed in as</p>
              <p className="truncate text-sm font-medium text-foreground">{personName}</p>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                <LogOut aria-hidden className="size-4" />
                <span className="hidden lg:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-(--content-max) items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <PortalNav approved={approved} />
          {approved ? (
            <div className="flex items-center gap-1.5 py-1.5 sm:gap-2 sm:py-2">
              <Link
                href="/wholesale/quick-order"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-foreground hover:bg-muted sm:h-9 sm:px-3 sm:text-sm"
                title="Quick order"
              >
                <Zap aria-hidden className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Quick order</span>
              </Link>
              <span
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-foreground-muted sm:h-9 sm:px-3 sm:text-sm"
                title="Cart opens with the catalog release"
              >
                <ShoppingCart aria-hidden className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="rounded-sm bg-muted px-1 text-2xs sm:px-1.5 sm:text-xs">0</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
