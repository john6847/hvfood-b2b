/**
 * Verification script for Catalog & Products database tables, RLS, and pricing RPC.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-catalog-db.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pubKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !pubKey || !serviceKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const pubClient = createClient(url, pubKey);
const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verify() {
  console.log("==================================================");
  console.log("  Catalog & Products Database Verification");
  console.log("==================================================");

  // 1. Check Categories
  console.log("\n[1/4] Checking categories in database...");
  const { data: categories, error: catErr } = await pubClient
    .from("product_categories")
    .select("name, slug, sort_order")
    .order("sort_order");

  if (catErr || !categories) {
    throw new Error(`Category check failed: ${catErr?.message}`);
  }
  console.log(`✅ Found ${categories.length} categories:`);
  categories.forEach((c) => console.log(`   - ${c.name} (${c.slug})`));

  // 2. Check Products Table as public
  console.log("\n[2/4] Checking public products query...");
  const { data: products, error: prodErr } = await pubClient
    .from("products")
    .select("id, name, sku, slug, brand, base_unit")
    .order("name");

  if (prodErr || !products) {
    throw new Error(`Products check failed: ${prodErr?.message}`);
  }
  console.log(`✅ Found ${products.length} products in public table.`);

  // 3. Test RPC as Anonymous Visitor (No prices leaked)
  console.log("\n[3/4] Testing get_catalog_for_company RPC without company ID...");
  const { data: publicCatalog, error: rpcErr1 } = await pubClient.rpc("get_catalog_for_company", {
    p_company_id: null,
  });

  if (rpcErr1 || !publicCatalog) {
    throw new Error(`Public RPC check failed: ${rpcErr1?.message}`);
  }
  const anyPriceLeaked = publicCatalog.some((p: { case_price_minor: number | null }) => p.case_price_minor !== null);
  if (anyPriceLeaked) {
    throw new Error("❌ Security violation: Wholesale price leaked to anonymous caller!");
  }
  console.log(`✅ Public catalog returned ${publicCatalog.length} products with ZERO prices leaked.`);

  // 4. Test RPC with Approved Buyer Company ID
  console.log("\n[4/4] Testing get_catalog_for_company RPC for approved buyer company...");
  const { data: companies } = await adminClient
    .from("companies")
    .select("id, legal_name, pricing_tier_id")
    .eq("status", "APPROVED")
    .limit(1);

  if (!companies || companies.length === 0) {
    throw new Error("No approved company found to test buyer pricing.");
  }
  const company = companies[0]!;

  const { data: buyerCatalog, error: rpcErr2 } = await adminClient.rpc("get_catalog_for_company", {
    p_company_id: company.id,
  });

  if (rpcErr2 || !buyerCatalog) {
    throw new Error(`Buyer RPC check failed: ${rpcErr2?.message}`);
  }

  const pricedItems = buyerCatalog.filter((p: { case_price_minor: number | null }) => p.case_price_minor !== null);
  console.log(`✅ Buyer catalog returned ${buyerCatalog.length} products.`);
  console.log(`✅ Wholesale pricing active on ${pricedItems.length} products for company "${company.legal_name}":`);
  pricedItems.slice(0, 4).forEach((p: { product_name: string; pack_name: string; case_price_minor: number; volume_breaks: Array<{ minimumCases: number; unitPriceMinor: number }> }) => {
    const priceDollars = (p.case_price_minor / 100).toFixed(2);
    const breakInfo = p.volume_breaks && p.volume_breaks.length > 0
      ? `(Volume: ${p.volume_breaks[0]?.minimumCases}+ cases at $${((p.volume_breaks[0]?.unitPriceMinor ?? 0) / 100).toFixed(2)})`
      : "";
    console.log(`   - ${p.product_name} [${p.pack_name}]: $${priceDollars}/case ${breakInfo}`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL PRODUCTS & CATALOG DATABASE CHECKS PASSED!");
  console.log("==================================================");
}

verify().catch((e) => {
  console.error("❌ Catalog verification failed:", e);
  process.exit(1);
});
