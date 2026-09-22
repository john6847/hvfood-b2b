import type { Metadata } from "next";
import { Package } from "lucide-react";
import { CatalogFilters } from "@/components/commerce/catalog-filters";
import { CatalogToolbar } from "@/components/commerce/catalog-toolbar";
import { PricingNotice } from "@/components/commerce/pricing-notice";
import { ProductCard } from "@/components/commerce/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { getPriceAccess } from "@/modules/catalog/access";
import { getActiveMembership } from "@/modules/identity/service";
import { getDbCatalog, getDbCategories } from "@/modules/catalog/catalog-service";
import {
  CATALOG_BRANDS,
  categoryCounts,
  filterCatalog,
  withoutPricing,
  type CatalogSort,
} from "@/modules/catalog/fixtures";

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
 * Wholesale catalog. Anyone may browse products; only approved members get
 * prices. Everyone else receives records with the price fields stripped
 * and cannot sort by price, so nothing about pricing reaches their browser.
 */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [access, membership] = await Promise.all([
    getPriceAccess(),
    getActiveMembership(),
  ]);
  const companyId = membership?.companyStatus === "APPROVED" ? membership.companyId : null;
  const priced = access === "approved";

  const [allCatalogProducts, dbCategories] = await Promise.all([
    getDbCatalog(companyId),
    getDbCategories(),
  ]);

  const params = await searchParams;
  const category = dbCategories.includes(params.category as string)
    ? (params.category as string)
    : null;
  const brandParam = params.brand === undefined ? [] : Array.isArray(params.brand) ? params.brand : [params.brand];
  const brands = brandParam.filter((b) => (CATALOG_BRANDS as readonly string[]).includes(b));
  const inStockOnly = params.stock === "1";
  const search = params.q?.trim() ?? "";
  const requestedSort = SORTS.includes(params.sort as CatalogSort) ? (params.sort as CatalogSort) : "recommended";
  const sort: CatalogSort = !priced && requestedSort.startsWith("price") ? "recommended" : requestedSort;
  const view: "grid" | "list" = params.view === "list" ? "list" : "grid";

  const matches = filterCatalog(allCatalogProducts, {
    category: category ?? undefined,
    brands,
    inStockOnly,
    search,
    sort,
  });
  const products = priced ? matches : matches.map(withoutPricing);
  const counts = categoryCounts(allCatalogProducts);
  const categories = dbCategories.map((name) => ({ name, count: counts.get(name) ?? 0 }));

  return (
    <>
      <PageHeading
        eyebrow="Good food. Good business."
        title="Wholesale catalog"
        description={
          priced
            ? "Live wholesale pricing for your approved account. Order in full cases; discounts apply automatically at checkout."
            : "Browse our full product assortment. Sign in with an approved company account to view wholesale case pricing."
        }
      />

      {access !== "approved" ? (
        <PricingNotice access={access} next="/wholesale/catalog" className="mt-4" />
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <CatalogFilters
            categories={categories}
            total={allCatalogProducts.length}
            brands={CATALOG_BRANDS}
            activeCategory={category}
            activeBrands={brands}
            inStockOnly={inStockOnly}
          />
        </aside>

        <section aria-label="Products">
          <CatalogToolbar
            count={products.length}
            sort={sort}
            view={view}
            search={search}
            priced={priced}
          />

          {products.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<Package className="size-6 text-foreground-muted" />}
                title="No products found"
                description="Try changing the category or clearing the search filter."
                action={<ButtonLink href="/wholesale/catalog">Clear filters</ButtonLink>}
              />
            </div>
          ) : (
            <div
              className={cn(
                "mt-6",
                view === "grid"
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-3",
              )}
            >
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} view={view} access={access} />
              ))}
            </div>
          )}

          <p className="mt-8 text-xs text-foreground-muted">
            {products.length} of {allCatalogProducts.length} products · Wholesale pricing in {brand.currency}. Product
            data is being finalized; case packs, prices and availability shown here are provisional.
          </p>
        </section>
      </div>
    </>
  );
}
