"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const approvedItems = [
  { href: "/wholesale/dashboard", label: "Dashboard" },
  { href: "/wholesale/catalog", label: "Shop products" },
  { href: "/wholesale/orders", label: "Orders" },
  { href: "/wholesale/account", label: "Account" },
];

const limitedItems = [
  { href: "/wholesale/dashboard", label: "Account status" },
  { href: "/wholesale/account", label: "Company" },
];

export function PortalNav({ approved }: { approved: boolean }) {
  const pathname = usePathname();
  const items = approved ? approvedItems : limitedItems;

  return (
    <nav aria-label="Wholesale" className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex h-12 items-center whitespace-nowrap border-b-2 px-3 text-sm",
              current
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-foreground-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
