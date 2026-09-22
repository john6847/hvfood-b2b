"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Headset, RotateCcw, X } from "lucide-react";
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
 * Responsive catalog filters: slide-over drawer on mobile (<lg) and
 * sticky sidebar on desktop (lg+). Choices are URL-backed.
 */
export function CatalogFilters({
  categories,
  total,
  brands,
  activeCategory,
  activeBrands,
  inStockOnly,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Active filter count
  const activeCount =
    (activeCategory !== null ? 1 : 0) +
    activeBrands.length +
    (inStockOnly ? 1 : 0);

  // Lock scroll when mobile drawer open
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

  const filterContent = (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="eyebrow">Categories</h2>
          <span className="text-xs text-foreground-muted">{total}</span>
        </div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href={categoryHref(null)}
              onClick={() => setMobileOpen(false)}
              aria-current={activeCategory === null ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                activeCategory === null
                  ? "bg-accent font-semibold text-primary"
                  : "text-foreground hover:bg-muted",
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
                onClick={() => setMobileOpen(false)}
                aria-current={activeCategory === c.name ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                  activeCategory === c.name
                    ? "bg-accent font-semibold text-primary"
                    : "text-foreground hover:bg-muted",
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
        <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
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
            className="size-4 rounded accent-[var(--primary)]"
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
                <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
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
                    className="size-4 rounded accent-[var(--primary)]"
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
          Need help with bulk quantities or building your assortment? Reach the wholesale team at{" "}
          {brand.supportEmail}.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Filter Button Bar */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Filter className="size-4 text-foreground-muted" aria-hidden />
          <span>Filters</span>
          {activeCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount > 0 ? (
          <Link
            href="/wholesale/catalog"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <RotateCcw className="size-3" aria-hidden />
            Clear filters ({activeCount})
          </Link>
        ) : (
          <span className="text-xs text-foreground-muted">
            {activeCategory ? activeCategory : "All categories"}
          </span>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-primary" aria-hidden />
                <h2 className="text-base font-semibold text-foreground">Filters</h2>
                {activeCount > 0 ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
                    {activeCount} active
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="flex flex-col gap-6">{filterContent}</div>
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-surface-muted p-4">
              {activeCount > 0 ? (
                <Link
                  href="/wholesale/catalog"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-border bg-surface text-xs font-medium text-foreground hover:bg-muted"
                >
                  Reset all
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-6" aria-label="Catalog filters">
        {filterContent}
      </aside>
    </>
  );
}
