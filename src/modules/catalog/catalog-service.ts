import "server-only";
import { cache } from "react";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import {
  catalogProducts as fixtureProducts,
  findProductBySlug as fixtureFindBySlug,
  CATALOG_CATEGORIES as fixtureCategories,
  type CatalogProduct,
  type PublicCatalogProduct,
  type VolumeBreak,
} from "./fixtures";

export type DbCatalogItem = {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  brand: string;
  categoryName: string;
  categorySlug: string;
  tag: string | null;
  packName: string;
  packSku: string;
  unitsPerCase: number;
  available: boolean;
  casePriceMinor: number | null;
  volumeBreaks: VolumeBreak[];
};

/**
 * Loads catalog products from Supabase.
 * If companyId is supplied and caller has approved membership, wholesale prices are included.
 * Otherwise, prices remain omitted (null) for visitor safety.
 */
export const getDbCatalog = cache(
  async (companyId?: string | null): Promise<Array<CatalogProduct | PublicCatalogProduct>> => {
    if (STATIC_PREVIEW) {
      return companyId ? fixtureProducts : fixtureProducts.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { casePriceMinor, volumeBreaks, ...rest } = p;
        return rest;
      });
    }

    try {
      const supabase = await createSessionClient();
      const { data, error } = await supabase.rpc("get_catalog_for_company", {
        p_company_id: companyId ?? undefined,
      });

      if (error || !data || data.length === 0) {
        if (error) console.error("get_catalog_for_company error:", error);
        return fixtureProducts;
      }

      return data.map((row) => {
        const hasPrice = row.case_price_minor !== null;
        const volumeBreaks: VolumeBreak[] = Array.isArray(row.volume_breaks)
          ? (row.volume_breaks as VolumeBreak[])
          : [];

        const base = {
          slug: row.product_slug,
          sku: row.product_sku,
          name: row.product_name,
          brand: row.brand,
          category: row.category_name,
          image: row.image_url || "/products/jasmine-rice.jpg",
          pack: row.pack_name,
          unitsPerCase: row.units_per_case,
          available: row.available ?? true,
          tag: row.tag || undefined,
          description: row.product_description,
        };

        if (hasPrice) {
          return {
            ...base,
            casePriceMinor: Number(row.case_price_minor),
            volumeBreaks,
          } as CatalogProduct;
        }

        return base as PublicCatalogProduct;
      });
    } catch (err) {
      console.error("Failed to load catalog from DB, falling back to fixtures:", err);
      return fixtureProducts;
    }
  }
);

/**
 * Loads a single product by slug, resolving prices for the company if authorized.
 */
export const getDbProductBySlug = cache(
  async (
    slug: string,
    companyId?: string | null
  ): Promise<CatalogProduct | PublicCatalogProduct | null> => {
    if (STATIC_PREVIEW) {
      const p = fixtureFindBySlug(slug);
      if (!p) return null;
      if (!companyId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { casePriceMinor, volumeBreaks, ...rest } = p;
        return rest;
      }
      return p;
    }

    const all = await getDbCatalog(companyId);
    const match = all.find((item) => item.slug === slug);
    return match ?? null;
  }
);

/**
 * Returns available categories from Supabase (or fixtures in preview).
 */
export const getDbCategories = cache(async (): Promise<string[]> => {
  if (STATIC_PREVIEW) {
    return [...fixtureCategories];
  }

  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("name")
      .eq("active", true)
      .order("sort_order");

    if (error || !data || data.length === 0) {
      return [...fixtureCategories];
    }

    return data.map((c) => c.name);
  } catch {
    return [...fixtureCategories];
  }
});
