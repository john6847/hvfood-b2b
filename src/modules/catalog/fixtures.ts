/**
 * STATIC CATALOG FIXTURES.
 *
 * The product records from the design preview, served as static content
 * until Phase 3 (catalog) and Phase 4 (pricing) replace them with database
 * rows, Shopify imports and the pricing engine. Product photographs are the
 * real retail images from horizonvertfoods.com. SKUs, case packs, prices,
 * volume breaks and availability are illustrative.
 *
 * Money is integer cents. Prices are only rendered to approved members;
 * the catalog route enforces that before importing this module's data.
 */

export type VolumeBreak = {
  /** Applies when the ordered case quantity is at least this value. */
  minimumCases: number;
  unitPriceMinor: number;
};

export type CatalogProduct = {
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  /** Human description of one case, e.g. "12 × 12 oz bags". */
  pack: string;
  unitsPerCase: number;
  /** Price per case at quantity 1, in cents. */
  casePriceMinor: number;
  volumeBreaks: VolumeBreak[];
  available: boolean;
  tag?: string;
  description: string;
};

export const CATALOG_CATEGORIES = [
  "Rice & grains",
  "Beans & legumes",
  "Spices & seasonings",
  "Flours & baking",
  "Sauces & condiments",
  "Coffee & beverages",
] as const;

export const CATALOG_BRANDS = ["Madame Sarah", "Horizon Vert", "Partner brands"] as const;

export const catalogProducts: CatalogProduct[] = [
  {
    slug: "jasmine-rice",
    sku: "HV-RIC-001",
    name: "Premium Jasmine Rice",
    brand: "Madame Sarah",
    category: "Rice & grains",
    image: "/products/jasmine-rice.jpg",
    pack: "4 × 20 lb bags",
    unitsPerCase: 4,
    casePriceMinor: 8496,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 7896 }],
    available: true,
    tag: "Bestseller",
    description:
      "A fragrant, long-grain pantry essential. Versatile rice for everyday dishes and Caribbean favorites.",
  },
  {
    slug: "madame-sarah-black-eye-peas",
    sku: "HV-BEA-002",
    name: "Dried Black-Eyed Peas",
    brand: "Madame Sarah",
    category: "Beans & legumes",
    image: "/products/madame-sarah-black-eye-peas.jpg",
    pack: "6 × 5 lb bags",
    unitsPerCase: 6,
    casePriceMinor: 4194,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 3894 }],
    available: true,
    description:
      "A staple for traditional recipes, soups and sides. Convenient retail-ready bags for your shelves.",
  },
  {
    slug: "fresh-epis-seasoning-medium-spicy",
    sku: "HV-EPI-003",
    name: "Fresh Epis · Medium",
    brand: "Madame Sarah",
    category: "Spices & seasonings",
    image: "/products/fresh-epis-seasoning-medium-spicy.jpg",
    pack: "12 × 16 oz jars",
    unitsPerCase: 12,
    casePriceMinor: 7190,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 6590 }],
    available: true,
    tag: "Customer favorite",
    description:
      "A traditional Haitian cooking base that brings a balanced, lively flavor to marinades, rice and stews.",
  },
  {
    slug: "haitian-coffee",
    sku: "HV-COF-004",
    name: "Haitian Ground Coffee",
    brand: "Horizon Vert",
    category: "Coffee & beverages",
    image: "/products/haitian-coffee.jpg",
    pack: "12 × 12 oz bags",
    unitsPerCase: 12,
    casePriceMinor: 9600,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 9000 }],
    available: true,
    description:
      "Distinctive Haitian coffee, ready for the morning ritual. An inviting addition to specialty grocery shelves.",
  },
  {
    slug: "breadfruit-flour",
    sku: "HV-FLR-005",
    name: "Breadfruit Flour",
    brand: "Madame Sarah",
    category: "Flours & baking",
    image: "/products/breadfruit-flour.jpg",
    pack: "12 × 2 lb bags",
    unitsPerCase: 12,
    casePriceMinor: 6590,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 5990 }],
    available: true,
    tag: "Pantry essential",
    description:
      "A versatile flour for baking and traditional cooking. Explore a Caribbean pantry favorite.",
  },
  {
    slug: "diri-shella-haitian-rice",
    sku: "HV-RIC-006",
    name: "Diri Shella Rice",
    brand: "Horizon Vert",
    category: "Rice & grains",
    image: "/products/diri-shella-haitian-rice.jpg",
    pack: "6 × 5 lb bags",
    unitsPerCase: 6,
    casePriceMinor: 4794,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 4494 }],
    available: true,
    description:
      "A familiar foundation for Haitian cooking, packed in practical bags for home cooks and specialty retailers.",
  },
  {
    slug: "small-red-beans",
    sku: "HV-BEA-007",
    name: "Small Red Beans",
    brand: "Madame Sarah",
    category: "Beans & legumes",
    image: "/products/small-red-beans.png",
    pack: "6 × 5 lb bags",
    unitsPerCase: 6,
    casePriceMinor: 4494,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 4194 }],
    available: true,
    description:
      "A pantry staple for rice and beans, hearty soups and traditional Caribbean dishes.",
  },
  {
    slug: "cornmeal",
    sku: "HV-GRN-008",
    name: "Golden Cornmeal",
    brand: "Madame Sarah",
    category: "Rice & grains",
    image: "/products/cornmeal.jpg",
    pack: "12 × 2 lb bags",
    unitsPerCase: 12,
    casePriceMinor: 3590,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 3290 }],
    available: true,
    description:
      "A versatile cornmeal for comforting everyday meals, traditional dishes and baking.",
  },
  {
    slug: "plantain-flour",
    sku: "HV-FLR-009",
    name: "Plantain Flour",
    brand: "Madame Sarah",
    category: "Flours & baking",
    image: "/products/plantain-flour.jpg",
    pack: "12 × 2 lb bags",
    unitsPerCase: 12,
    casePriceMinor: 5990,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 5490 }],
    available: true,
    description:
      "Bring a Caribbean pantry favorite to your assortment with retail-ready plantain flour.",
  },
  {
    slug: "caribbean-pikliz",
    sku: "HV-SAU-010",
    name: "Caribbean Pikliz",
    brand: "Partner brands",
    category: "Sauces & condiments",
    image: "/products/caribbean-pikliz.jpg",
    pack: "12 × 27 oz jars",
    unitsPerCase: 12,
    casePriceMinor: 8390,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 7790 }],
    available: true,
    description:
      "A bright, spicy shredded condiment to pair with traditional meals and grilled favorites.",
  },
  {
    slug: "djon-djon",
    sku: "HV-SPC-011",
    name: "Djon Djon Mushrooms",
    brand: "Madame Sarah",
    category: "Spices & seasonings",
    image: "/products/djon-djon.jpg",
    pack: "12 × 2 oz bags",
    unitsPerCase: 12,
    casePriceMinor: 11990,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 10990 }],
    available: false,
    description:
      "The signature ingredient behind Haitian black mushroom rice. Availability varies.",
  },
  {
    slug: "vanilla-extract",
    sku: "HV-BAK-012",
    name: "Vanilla Extract",
    brand: "Madame Sarah",
    category: "Flours & baking",
    image: "/products/vanilla-extract.jpg",
    pack: "12 × 8 fl oz bottles",
    unitsPerCase: 12,
    casePriceMinor: 5390,
    volumeBreaks: [{ minimumCases: 10, unitPriceMinor: 4990 }],
    available: true,
    description: "A classic baking staple for sweets, drinks and everyday recipes.",
  },
];

export function findProductBySlug(slug: string): CatalogProduct | undefined {
  return catalogProducts.find((p) => p.slug === slug);
}

/**
 * Deterministic price selection: the highest volume threshold at or below
 * the requested quantity wins; otherwise the base case price.
 */
export function casePriceForQuantity(product: CatalogProduct, cases: number): number {
  let price = product.casePriceMinor;
  let best = 0;
  for (const tier of product.volumeBreaks) {
    if (cases >= tier.minimumCases && tier.minimumCases > best) {
      best = tier.minimumCases;
      price = tier.unitPriceMinor;
    }
  }
  return price;
}

export type CatalogSort = "recommended" | "price-asc" | "price-desc" | "name";

export type CatalogQuery = {
  category?: string;
  brands?: string[];
  inStockOnly?: boolean;
  search?: string;
  sort?: CatalogSort;
};

export function filterCatalog(products: readonly CatalogProduct[], query: CatalogQuery) {
  const search = query.search?.trim().toLowerCase() ?? "";
  let result = products.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.brands?.length && !query.brands.includes(p.brand)) return false;
    if (query.inStockOnly && !p.available) return false;
    if (search) {
      const haystack = `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  switch (query.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.casePriceMinor - b.casePriceMinor);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.casePriceMinor - a.casePriceMinor);
      break;
    case "name":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }
  return result;
}

export function categoryCounts(products: readonly CatalogProduct[]) {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return counts;
}
