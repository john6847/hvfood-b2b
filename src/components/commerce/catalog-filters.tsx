"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Headset } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type Props = {
  categories: ReadonlyArray<{ name: string; count: number }>;
  total: number;
  brands: readonly string[];
  activeCategory: string | null;
  activeBrands: readonly string[];
  inStockOnly: boolean;
};

/**
 * Sidebar filters. Every choice lives in the URL so views are shareable
 * and the server does the filtering; this component only edits the query.
 */
export function CatalogFilters({ categories, total, brands, activeCategory, activeBrands, inStockOnly }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function categoryHref(name: string | null) {
    const next = new URLSearchParams(params.toString());
    if (name) next.set("category", name);
    else next.delete("category");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <aside className="flex flex-col gap-6" aria-label="Catalog filters">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="eyebrow">Categories</h2>
          <span className="text-xs text-foreground-muted">{total}</span>
        </div>
        <ul className="flex flex-col">
          <li>
            <Link
              href={categoryHref(null)}
              aria-current={activeCategory === null ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                activeCategory === null ? "bg-accent font-semibold text-primary" : "text-foreground hover:bg-muted",
              )}
            >
              All products
              <span className="text-xs text-foreground-muted">{total}</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.name}>
              <Link
                href={categoryHref(c.name)}
                aria-current={activeCategory === c.name ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                  activeCategory === c.name ? "bg-accent font-semibold text-primary" : "text-foreground hover:bg-muted",
                )}
              >
                {c.name}
                <span className="text-xs text-foreground-muted">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Availability</h2>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            key={String(inStockOnly)}
            type="checkbox"
            defaultChecked={inStockOnly}
            onChange={(e) =>
              update((next) => {
                if (e.target.checked) next.set("stock", "1");
                else next.delete("stock");
              })
            }
            className="size-4 accent-[var(--primary)]"
          />
          In stock only
        </label>
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Brand</h2>
        <ul className="flex flex-col gap-2">
          {brands.map((b) => {
            const checked = activeBrands.includes(b);
            return (
              <li key={b}>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    key={`${b}-${checked}`}
                    type="checkbox"
                    defaultChecked={checked}
                    onChange={() =>
                      update((next) => {
                        const current = next.getAll("brand");
                        next.delete("brand");
                        const updated = checked ? current.filter((x) => x !== b) : [...current, b];
                        for (const value of updated) next.append("brand", value);
                      })
                    }
                    className="size-4 accent-[var(--primary)]"
                  />
                  {b}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-lg bg-secondary p-4">
        <Headset className="size-5 text-foreground-muted" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-foreground">A partner in every order.</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Need help with bulk quantities or building your assortment? Reach the wholesale team at {brand.supportEmail}.
        </p>
      </div>
    </aside>
  );
}
