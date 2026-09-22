"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Home,
  Menu,
  Plug,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": Home,
  "/admin/applications": ClipboardList,
  "/admin/orders": ShoppingBag,
  "/admin/products": Boxes,
  "/admin/customers": Users,
  "/admin/pricing": DollarSign,
  "/admin/shipping": Truck,
  "/admin/integrations": Plug,
  "/admin/settings": Settings,
};

type Item = { href: string; label: string };

export function AdminSidebar({
  items,
  staffName,
  roleName,
}: {
  items: readonly Item[];
  staffName: string;
  roleName: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Wordmark href="/admin" caption={brand.adminLabel} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
            aria-expanded={mobileOpen}
            className="flex size-10 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
          >
            {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Wordmark href="/admin" caption={brand.adminLabel} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin menu"
                className="flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <nav aria-label="Admin mobile" className="flex-1 overflow-y-auto px-3 py-4">
              <p className="eyebrow px-3 pb-2">Admin Navigation</p>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const Icon = icons[item.href] ?? Home;
                  const current =
                    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                        current
                          ? "bg-accent text-primary font-semibold"
                          : "text-foreground-muted hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-border bg-surface-muted px-5 py-4">
              <Link
                href="/wholesale/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <span>View buyer portal</span>
                <ExternalLink className="size-3.5 text-foreground-muted" aria-hidden />
              </Link>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {initials(staffName)}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium text-foreground">{staffName}</p>
                  <p className="truncate text-xs text-foreground-muted">{roleName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-(--sidebar-width)">
        <div className="px-5 pt-6 pb-4">
          <Wordmark href="/admin" caption={brand.adminLabel} />
        </div>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {items.map((item) => {
            const Icon = icons[item.href] ?? Home;
            const current =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm",
                  current
                    ? "bg-accent font-semibold text-primary"
                    : "text-foreground-muted hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border px-5 py-4">
          <Link
            href="/wholesale/dashboard"
            className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground"
          >
            View buyer portal
            <ExternalLink className="size-3" aria-hidden />
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {initials(staffName)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{staffName}</p>
              <p className="truncate text-xs text-foreground-muted">{roleName}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
