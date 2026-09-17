"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  DollarSign,
  ExternalLink,
  Home,
  Plug,
  Settings,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": Home,
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

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-(--sidebar-width) lg:border-b-0 lg:border-r">
      <div className="px-5 pt-6 pb-4">
        <Wordmark href="/admin" caption={brand.adminLabel} />
      </div>

      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
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
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-border px-5 py-4 lg:block">
        <Link
          href="/wholesale/dashboard"
          className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground"
        >
          View buyer portal
          <ExternalLink className="size-3" aria-hidden />
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials(staffName)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">{staffName}</p>
            <p className="truncate text-xs text-foreground-muted">{roleName}</p>
          </div>
        </div>
      </div>
    </aside>
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
