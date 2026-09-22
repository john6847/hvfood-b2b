"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogSort } from "@/modules/catalog/fixtures";

const sortOptions: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

export function CatalogToolbar({
  count,
  sort,
  view,
  search,
  priced,
}: {
  count: number;
  sort: CatalogSort;
  view: "grid" | "list";
  search: string;
  /** False when the viewer cannot see prices, so price sorting is not offered. */
  priced: boolean;
}) {
  const sorts = priced ? sortOptions : sortOptions.filter((o) => !o.value.startsWith("price"));
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function withParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-xs text-foreground-muted sm:text-sm">
        <strong className="text-foreground">{count} products</strong>{priced ? " in your catalog" : null}
      </p>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            router.push(withParam("q", typeof value === "string" && value.trim() ? value.trim() : null));
          }}
          className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 sm:w-48 sm:flex-initial md:w-56"
        >
          <Search className="size-4 shrink-0 text-foreground-muted" aria-hidden />
          <label htmlFor="catalog-search" className="sr-only">
            Search products or SKU
          </label>
          <input
            id="catalog-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search name or SKU"
            className="w-full bg-transparent text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none sm:text-sm"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted sm:text-sm">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={sort}
              onChange={(e) => router.push(withParam("sort", e.target.value === "recommended" ? null : e.target.value))}
              className="h-9 rounded-md border border-border bg-surface px-2 text-xs text-foreground sm:text-sm"
            >
              {sorts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-flex h-9 overflow-hidden rounded-md border border-border" role="group" aria-label="View">
            <Link
              href={withParam("view", null)}
              aria-label="Grid view"
              aria-current={view === "grid" ? "true" : undefined}
              className={cn("flex w-9 items-center justify-center", view === "grid" ? "bg-muted text-foreground" : "text-foreground-muted hover:bg-muted")}
            >
              <LayoutGrid className="size-4" aria-hidden />
            </Link>
            <Link
              href={withParam("view", "list")}
              aria-label="List view"
              aria-current={view === "list" ? "true" : undefined}
              className={cn("flex w-9 items-center justify-center border-l border-border", view === "list" ? "bg-muted text-foreground" : "text-foreground-muted hover:bg-muted")}
            >
              <List className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
