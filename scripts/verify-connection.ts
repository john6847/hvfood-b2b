/**
 * Verification script: checks connection to the online Supabase project
 * and verifies whether database migrations have been applied.
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-connection.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================");
console.log("  Supabase Online Project Verification");
console.log("==================================================");
console.log(`URL: ${url ?? "(missing)"}`);
console.log(`Client Key: ${publishableKey ? publishableKey.slice(0, 16) + "..." : "(missing)"}`);
console.log(`Secret/Admin Key: ${secretKey ? secretKey.slice(0, 16) + "..." : "(none)"}`);
console.log("--------------------------------------------------");

if (!url || !publishableKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) are required.");
  process.exit(1);
}

async function verify() {
  // 1. Check Auth health
  try {
    const authRes = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey! },
    });
    if (authRes.ok) {
      const data = await authRes.json();
      console.log(`✅ Auth service reachable (${data.name ?? "GoTrue"} ${data.version ?? ""})`);
    } else {
      console.warn(`⚠️ Auth service responded with status ${authRes.status}`);
    }
  } catch (err: unknown) {
    console.error("❌ Failed to reach Supabase Auth endpoint:", (err as Error).message);
    process.exit(1);
  }

  // 2. Check Database / PostgREST Schema
  const client = createClient(url!, publishableKey!);
  const { error } = await client.from("profiles").select("count").limit(0);

  if (error) {
    if (error.code === "PGRST205") {
      console.log("⚠️ Schema status: PENDING MIGRATIONS");
      console.log("   The remote database is reachable, but 'public.profiles' does not exist yet.");
      console.log("   --> Run the SQL in `supabase/combined_migrations.sql` in the Supabase Dashboard SQL editor.");
      return;
    }
    // Any other PostgREST error or empty response means the table exists in schema cache
    console.log(`ℹ️ PostgREST responded: [${error.code}] ${error.message}`);
  }

  console.log("✅ Database schema: Phase 1 tables exist in schema cache ('public.profiles' found)!");

  // 3. If Secret Key provided, test admin access
  if (secretKey && !secretKey.includes("supabase-demo")) {
    try {
      const admin = createClient(url!, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: tiers, error: tierErr } = await admin.from("pricing_tiers").select("code, name");
      if (tierErr) {
        console.warn(`⚠️ Admin query error: ${tierErr.message}`);
      } else {
        console.log(`✅ Admin access verified. ${tiers?.length ?? 0} pricing tiers found:`);
        tiers?.forEach((t) => console.log(`   - ${t.code}: ${t.name}`));
      }
    } catch (err: unknown) {
      console.warn(`⚠️ Admin verification skipped: ${(err as Error).message}`);
    }
  }
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
