/**
 * Seeds the remote Supabase database with categories, wholesale products,
 * packaging specifications, price lists, and volume breaks.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-catalog.ts
 */

import { createClient } from "@supabase/supabase-js";
import { catalogProducts, CATALOG_CATEGORIES } from "../src/modules/catalog/fixtures";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  console.log("==================================================");
  console.log("  Seeding Catalog & Wholesale Products");
  console.log("==================================================");

  // 1. Seed Categories
  console.log("\n[1/4] Seeding product categories...");
  const categoryMap = new Map<string, string>();

  for (let i = 0; i < CATALOG_CATEGORIES.length; i++) {
    const name = CATALOG_CATEGORIES[i]!;
    const slug = slugify(name);

    const { data: cat, error: catErr } = await admin
      .from("product_categories")
      .upsert(
        {
          name,
          slug,
          sort_order: (i + 1) * 10,
          active: true,
        },
        { onConflict: "slug" }
      )
      .select("id, name")
      .single();

    if (catErr || !cat) {
      throw new Error(`Failed to upsert category "${name}": ${catErr?.message}`);
    }

    categoryMap.set(name, cat.id);
    console.log(`   - Category: ${cat.name} (${cat.id})`);
  }

  // 2. Fetch Pricing Tiers
  console.log("\n[2/4] Fetching pricing tiers...");
  const { data: tiers, error: tierErr } = await admin
    .from("pricing_tiers")
    .select("id, code, name")
    .order("code");

  if (tierErr || !tiers || tiers.length === 0) {
    throw new Error(`Failed to fetch pricing tiers: ${tierErr?.message}`);
  }

  // Ensure price lists for tiers
  const priceListMap = new Map<string, string>();
  for (const tier of tiers) {
    const { data: pl, error: plErr } = await admin
      .from("price_lists")
      .upsert(
        {
          name: `${tier.name} Wholesale Price List`,
          currency: "USD",
          scope: "TIER",
          pricing_tier_id: tier.id,
          active: true,
        },
        { onConflict: "scope,pricing_tier_id" }
      )
      .select("id, name")
      .single();

    if (plErr || !pl) {
      throw new Error(`Failed to create price list for tier "${tier.code}": ${plErr?.message}`);
    }

    priceListMap.set(tier.code, pl.id);
    console.log(`   - Price List: ${pl.name} (${pl.id})`);
  }

  // Tier discount multipliers relative to standard
  const tierMultipliers: Record<string, number> = {
    STANDARD: 1.0,
    BRONZE: 0.95,
    SILVER: 0.9,
    GOLD: 0.85,
    CUSTOM: 0.8,
  };

  // 3. Seed Products & Packaging
  console.log("\n[3/4] Seeding products, packaging, and tiered pricing...");
  for (const item of catalogProducts) {
    const categoryId = categoryMap.get(item.category) ?? null;

    // Upsert product
    const { data: product, error: prodErr } = await admin
      .from("products")
      .upsert(
        {
          sku: item.sku,
          slug: item.slug,
          name: item.name,
          description: item.description,
          brand: item.brand,
          category_id: categoryId,
          image_url: item.image,
          tag: item.tag || null,
          active: true,
          wholesale_enabled: true,
          base_unit: "EACH",
        },
        { onConflict: "sku" }
      )
      .select("id, name, sku")
      .single();

    if (prodErr || !product) {
      throw new Error(`Failed to upsert product "${item.name}": ${prodErr?.message}`);
    }

    // Upsert packaging (case pack)
    const packagingSku = `${item.sku}-CASE`;
    const { data: pkg, error: pkgErr } = await admin
      .from("product_packaging")
      .upsert(
        {
          product_id: product.id,
          name: item.pack,
          type: "CASE",
          sku: packagingSku,
          units_per_case: item.unitsPerCase,
          minimum_quantity: 1,
          quantity_increment: 1,
          active: true,
        },
        { onConflict: "sku" }
      )
      .select("id, name, sku")
      .single();

    if (pkgErr || !pkg) {
      throw new Error(`Failed to upsert packaging for "${item.name}": ${pkgErr?.message}`);
    }

    // Upsert price list items across tiers
    for (const tier of tiers) {
      const priceListId = priceListMap.get(tier.code);
      if (!priceListId) continue;

      const multiplier = tierMultipliers[tier.code] ?? 1.0;
      const baseCasePrice = Math.round(item.casePriceMinor * multiplier);

      const { data: pli, error: pliErr } = await admin
        .from("price_list_items")
        .upsert(
          {
            price_list_id: priceListId,
            packaging_id: pkg.id,
            unit_price_minor: baseCasePrice,
          },
          { onConflict: "price_list_id,packaging_id" }
        )
        .select("id")
        .single();

      if (pliErr || !pli) {
        throw new Error(`Failed to set price for "${item.name}" on ${tier.code}: ${pliErr?.message}`);
      }

      // Quantity price breaks for this packaging item
      if (item.volumeBreaks && item.volumeBreaks.length > 0) {
        for (const vb of item.volumeBreaks) {
          const tieredBreakPrice = Math.round(vb.unitPriceMinor * multiplier);
          await admin.from("quantity_price_breaks").upsert(
            {
              price_list_item_id: pli.id,
              minimum_quantity: vb.minimumCases,
              unit_price_minor: tieredBreakPrice,
            },
            { onConflict: "price_list_item_id,minimum_quantity" }
          );
        }
      }
    }

    console.log(`   ✓ ${product.name} (${item.sku}) seeded with case pack and pricing`);
  }

  // 4. Verify Total Seed Counts
  console.log("\n[4/4] Verifying catalog database records...");
  const { count: catCount } = await admin.from("product_categories").select("*", { count: "exact", head: true });
  const { count: prodCount } = await admin.from("products").select("*", { count: "exact", head: true });
  const { count: pkgCount } = await admin.from("product_packaging").select("*", { count: "exact", head: true });
  const { count: pliCount } = await admin.from("price_list_items").select("*", { count: "exact", head: true });

  console.log("==================================================");
  console.log(`✅ Catalog Seeding Complete!`);
  console.log(`   - Categories:       ${catCount}`);
  console.log(`   - Products:         ${prodCount}`);
  console.log(`   - Packaging:        ${pkgCount}`);
  console.log(`   - Price List Items: ${pliCount}`);
  console.log("==================================================");
}

seed().catch((err) => {
  console.error("❌ Catalog seeding failed:", err);
  process.exit(1);
});
