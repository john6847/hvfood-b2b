import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { CatalogFilters } from "@/components/commerce/catalog-filters";
import { CatalogToolbar } from "@/components/commerce/catalog-toolbar";
import { ProductCard } from "@/components/commerce/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import {
  CATALOG_BRANDS,
  CATALOG_CATEGORIES,
  catalogProducts,
  categoryCounts,
  filterCatalog,
  type CatalogSort,
} from "@/modules/catalog/fixtures";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Catalog" };

const SORTS: CatalogSort[] = ["recommended", "price-asc", "price-desc", "name"];

type Params = {
  category?: string;
  brand?: string | string[];
  stock?: string;
  q?: string;
  sort?: string;
  view?: string;
};

/**
 * Wholesale catalog. Approved members only: prices never render for
 * anyone else. Products are static fixtures until the catalog and pricing
 * phases replace them with database rows and the pricing engine.
 */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const membership = await getActiveMembership();
  if (membership?.companyStatus !== "APPROVED") redirect("/wholesale/dashboard");

  const params = await searchParams;
  const category = CATALOG_CATEGORIES.includes(params.category as (typeof CATALOG_CATEGORIES)[number])
    ? (params.category as string)
    : null;
  const brandParam = params.brand === undefined ? [] : Array.isArray(params.brand) ? params.brand : [params.brand];
  const brands = brandParam.filter((b) => (CATALOG_BRANDS as readonly string[]).includes(b));
  const inStockOnly = params.stock === "1";
  const search = params.q?.trim() ?? "";
  const sort: CatalogSort = SORTS.includes(params.sort as CatalogSort) ? (params.sort as CatalogSort) : "recommended";
  const view: "grid" | "list" = params.view === "list" ? "list" : "grid";

  const products = filterCatalog(catalogProducts, {
    category: category ?? undefined,
    brands,
    inStockOnly,
    search,
    sort,
  });
  const counts = categoryCounts(catalogProducts);
  const categories = CATALOG_CATEGORIES.map((name) => ({ name, count: counts.get(name) ?? 0 }));

  return (
    <>
      <PageHeading
        eyebrow="Good food. Good business."
        title="Wholesale catalog"
        description="Your essentials, by the case. Quality ingredients for your next order."
        action={
          <ButtonLink href="/wholesale/quick-order" variant="secondary" size="sm">
            Quick order by SKU
          </ButtonLink>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
        <CatalogFilters
          categories={categories}
          total={catalogProducts.length}
          brands={CATALOG_BRANDS}
          activeCategory={category}
          activeBrands={brands}
          inStockOnly={inStockOnly}
        />

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 rounded-md bg-success-bg px-4 py-3 text-sm text-success-fg">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            <p>
              <strong>Your wholesale pricing is ready.</strong> Case pricing shown in {brand.currency}. Save more
              when you order 10+ cases.
            </p>
            <Package className="ml-auto size-4 shrink-0 opacity-60" aria-hidden />
          </div>

          <CatalogToolbar count={products.length} sort={sort} view={view} search={search} />

          {products.length === 0 ? (
            <EmptyState
              title="No products match"
              description="Try another category, clear a brand filter, or search by SKU."
              action={
                <ButtonLink href="/wholesale/catalog" variant="secondary" size="sm">
                  Clear filters
                </ButtonLink>
              }
            />
          ) : (
            <div
              className={cn(
                "grid gap-4",
                view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1",
              )}
            >
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} view={view} />
              ))}
            </div>
          )}

          <p className="border-t border-border pt-4 text-xs text-foreground-muted">
            {products.length} of {catalogProducts.length} products · Wholesale pricing in {brand.currency}. Product
            data is being finalized; case packs, prices and availability shown here are provisional.
          </p>
        </div>
      </div>
    </>
  );
}
