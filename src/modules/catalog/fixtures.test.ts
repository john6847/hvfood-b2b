import { describe, expect, it } from "vitest";
import {
  casePriceForQuantity,
  catalogProducts,
  filterCatalog,
  findProductBySlug,
} from "./fixtures";

describe("catalog fixtures", () => {
  it("have unique SKUs and slugs", () => {
    expect(new Set(catalogProducts.map((p) => p.sku)).size).toBe(catalogProducts.length);
    expect(new Set(catalogProducts.map((p) => p.slug)).size).toBe(catalogProducts.length);
  });

  it("price volume breaks at the boundary", () => {
    const coffee = findProductBySlug("haitian-coffee")!;
    expect(casePriceForQuantity(coffee, 1)).toBe(9600);
    expect(casePriceForQuantity(coffee, 9)).toBe(9600);
    expect(casePriceForQuantity(coffee, 10)).toBe(9000);
    expect(casePriceForQuantity(coffee, 999)).toBe(9000);
  });

  it("filter by category, brand, stock and search", () => {
    expect(filterCatalog(catalogProducts, { category: "Rice & grains" })).toHaveLength(3);
    expect(filterCatalog(catalogProducts, { brands: ["Horizon Vert"] })).toHaveLength(2);
    expect(filterCatalog(catalogProducts, { inStockOnly: true })).toHaveLength(11);
    expect(filterCatalog(catalogProducts, { search: "hv-cof" })[0]?.slug).toBe("haitian-coffee");
  });

  it("sort by price and name", () => {
    const asc = filterCatalog(catalogProducts, { sort: "price-asc" });
    expect(asc[0]?.slug).toBe("cornmeal");
    const byName = filterCatalog(catalogProducts, { sort: "name" });
    expect(byName[0]?.name).toBe("Breadfruit Flour");
  });
});
