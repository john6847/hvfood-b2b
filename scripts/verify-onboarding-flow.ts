/**
 * End-to-end verification script for Phase 2: Accounts & Onboarding.
 * Tests application submission, database storage, approval RPC, company creation,
 * invitation generation, and token lookup against the live hosted Supabase instance.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-onboarding-flow.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error("Missing required Supabase environment variables.");
  process.exit(1);
}

const adminClient = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function run() {
  console.log("==================================================");
  console.log("  Phase 2: Accounts & Onboarding E2E Verification");
  console.log("==================================================");

  const testSuffix = Date.now().toString(36);
  const testEmail = `test-onboarding-${testSuffix}@example.com`;
  const testBusinessName = `Artisan Bakery ${testSuffix}`;

  let createdAppId: string | null = null;
  let createdCompanyId: string | null = null;

  try {
    // Step 1: Submit Wholesale Application via admin client (same as Server Action)
    console.log(`\n[1/5] Submitting test application for "${testBusinessName}"...`);
    const { data: appInsert, error: appErr } = await adminClient
      .from("wholesale_applications")
      .insert({
        business_name: testBusinessName,
        business_type: "RETAIL_STORE",
        business_number: "TAX-12345",
        first_name: "Jean",
        last_name: "Valjean",
        email: testEmail,
        phone: "+1 555-0199",
        website: "https://artisan-bakery.example.com",
        submission_key: randomBytes(16).toString("hex").replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
        address: {
          street1: "123 Boulangerie Ave",
          street2: "Suite 4B",
          city: "Montreal",
          state: "QC",
          postal_code: "H2X 1Y6",
          country: "CA",
        },
        estimated_monthly_volume: "5,000 - 10,000 CAD",
        products_interested_in: ["Specialty Flour", "Organic Grains"],
        applicant_notes: "Dock access available from 6am to 2pm.",
      })
      .select("id, status, business_name")
      .single();

    if (appErr || !appInsert) {
      throw new Error(`Application submission failed: ${appErr?.message}`);
    }

    createdAppId = appInsert.id;
    console.log(`✅ Application created with ID: ${createdAppId} (status: ${appInsert.status})`);

    // Step 2: Fetch Active Pricing Tier
    console.log("\n[2/5] Fetching active pricing tiers...");
    const { data: tiers, error: tierErr } = await adminClient
      .from("pricing_tiers")
      .select("id, code, name")
      .eq("active", true)
      .limit(1);

    if (tierErr || !tiers || tiers.length === 0) {
      throw new Error(`Failed to fetch pricing tier: ${tierErr?.message}`);
    }

    const tier = tiers[0]!;
    console.log(`✅ Using pricing tier: ${tier.name} (${tier.code}, ID: ${tier.id})`);

    // Step 3: Approve Application via transactional RPC
    console.log("\n[3/5] Executing admin_approve_application RPC...");
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const { data: approvalResult, error: approveErr } = await adminClient.rpc(
      "admin_approve_application",
      {
        p_application_id: createdAppId,
        p_pricing_tier_id: tier.id,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
        p_internal_notes: "Verified bakery license with provincial registrar.",
      }
    );

    if (approveErr || !approvalResult || approvalResult.length === 0) {
      throw new Error(`Approval RPC failed: ${approveErr?.message}`);
    }

    const approval = approvalResult[0]!;
    createdCompanyId = approval.company_id;
    console.log(`✅ Application approved!`);
    console.log(`   - Created Company ID: ${approval.company_id}`);
    console.log(`   - Created Invitation ID: ${approval.invitation_id}`);

    // Step 4: Verify generated Company, Address, Location, and Application Status
    console.log("\n[4/5] Verifying database records...");
    const { data: company, error: compErr } = await adminClient
      .from("companies")
      .select("id, legal_name, display_name, status, pricing_tier_id")
      .eq("id", createdCompanyId)
      .single();

    if (compErr || !company) {
      throw new Error(`Company verification failed: ${compErr?.message}`);
    }
    console.log(`   - Company "${company.display_name}" verified (status: ${company.status})`);

    const { data: addresses, error: addrErr } = await adminClient
      .from("company_addresses")
      .select("id, label, line1, city, region, postal_code")
      .eq("company_id", createdCompanyId);

    if (addrErr || !addresses || addresses.length === 0) {
      throw new Error(`Address verification failed: ${addrErr?.message}`);
    }
    console.log(`   - Primary Address verified: "${addresses[0]?.line1}, ${addresses[0]?.city}, ${addresses[0]?.region}"`);

    const { data: locations, error: locErr } = await adminClient
      .from("company_locations")
      .select("id, name, active")
      .eq("company_id", createdCompanyId);

    if (locErr || !locations || locations.length === 0) {
      throw new Error(`Location verification failed: ${locErr?.message}`);
    }
    console.log(`   - Primary Location verified: "${locations[0]?.name}" (active: ${locations[0]?.active})`);

    // Step 5: Verify Invitation lookup by token
    console.log("\n[5/5] Verifying invitation token lookup via get_invitation_details RPC...");
    const { data: inviteDetails, error: inviteErr } = await adminClient.rpc(
      "get_invitation_details",
      { p_token_hash: tokenHash }
    );

    if (inviteErr || !inviteDetails || inviteDetails.length === 0) {
      throw new Error(`Invitation lookup failed: ${inviteErr?.message}`);
    }

    const invite = inviteDetails[0]!;
    console.log(`✅ Invitation successfully retrieved:`);
    console.log(`   - Company: ${invite.company_name}`);
    console.log(`   - Email: ${invite.email}`);
    console.log(`   - Role: ${invite.role}`);
    console.log(`   - Is Expired: ${invite.is_expired}`);
    console.log(`   - Is Accepted: ${invite.is_accepted}`);

    console.log("\n🎉 ALL PHASE 2 DATABASE & ONBOARDING CHECKS PASSED!");
  } finally {
    // Cleanup test records
    console.log("\n🧹 Cleaning up test records...");
    if (createdCompanyId) {
      await adminClient.from("company_invitations").delete().eq("company_id", createdCompanyId);
      await adminClient.from("company_locations").delete().eq("company_id", createdCompanyId);
      await adminClient.from("company_addresses").delete().eq("company_id", createdCompanyId);
      await adminClient.from("company_commerce_policies").delete().eq("company_id", createdCompanyId);
      await adminClient.from("companies").delete().eq("id", createdCompanyId);
      console.log(`   - Deleted test company ${createdCompanyId}`);
    }
    if (createdAppId) {
      await adminClient.from("wholesale_applications").delete().eq("id", createdAppId);
      console.log(`   - Deleted test application ${createdAppId}`);
    }
    console.log("✅ Cleanup complete.");
  }
}

run().catch((err) => {
  console.error("❌ Test run failed:", err);
  process.exit(1);
});
