/**
 * Operator action: Creates or updates a wholesale customer account (Buyer/Owner).
 * Sets up the auth user with confirmed email, company profile, addresses,
 * delivery locations, commerce policies, and company membership.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/create-buyer.ts [email] [password] [companyName]
 *
 * Defaults:
 *   email: buyer@horizonvertfoods.com
 *   password: HorizonVert2026!
 *   company: Gourmet Provisions Market
 */

import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "buyer@horizonvertfoods.com").trim().toLowerCase();
const password = process.argv[3] || "HorizonVert2026!";
const companyName = process.argv[4] || "Gourmet Provisions Market";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target: string) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function run() {
  console.log("==================================================");
  console.log("  Wholesale Buyer Account Provisioning");
  console.log("==================================================");
  console.log(`Email:        ${email}`);
  console.log(`Company:      ${companyName}`);
  console.log(`Role:         OWNER / BUYER`);
  console.log(`Password:     ${password}`);
  console.log("--------------------------------------------------");

  // 1. Create or update auth user
  let userId: string;
  const existing = await findUserByEmail(email);

  if (existing) {
    console.log(`Found existing auth user: ${existing.id}. Updating password and confirming email...`);
    const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Alex",
        last_name: "Buyer",
      },
    });
    if (updateErr) throw updateErr;
    userId = updated.user.id;
  } else {
    console.log("Creating new confirmed auth user in Supabase...");
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Alex",
        last_name: "Buyer",
      },
    });
    if (createErr) throw createErr;
    userId = created.user.id;
  }

  // 2. Ensure profile details
  console.log("Updating public profile...");
  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: "Alex",
    last_name: "Buyer",
    phone: "+1 305-555-0144",
    locale: "en-US",
  });

  // 3. Find or create company
  console.log(`Checking company "${companyName}"...`);
  const { data: existingCompanies } = await admin
    .from("companies")
    .select("id, status")
    .eq("legal_name", companyName)
    .limit(1);

  let companyId: string;

  // Get active pricing tier
  const { data: tiers } = await admin
    .from("pricing_tiers")
    .select("id")
    .eq("code", "STANDARD")
    .limit(1);
  const pricingTierId = tiers?.[0]?.id ?? null;

  if (existingCompanies && existingCompanies.length > 0) {
    companyId = existingCompanies[0]!.id;
    console.log(`Found existing company ID: ${companyId}`);
    // Ensure approved
    await admin.from("companies").update({ status: "APPROVED" }).eq("id", companyId);
  } else {
    console.log("Creating new approved company...");
    const { data: newCompany, error: compErr } = await admin
      .from("companies")
      .insert({
        legal_name: companyName,
        display_name: companyName,
        email,
        phone: "+1 305-555-0144",
        status: "APPROVED",
        pricing_tier_id: pricingTierId,
      })
      .select("id")
      .single();

    if (compErr || !newCompany) throw new Error(`Failed to create company: ${compErr?.message}`);
    companyId = newCompany.id;
    console.log(`Created company ID: ${companyId}`);
  }

  // 4. Ensure address and delivery location
  const { data: existingAddrs } = await admin
    .from("company_addresses")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);

  let addressId: string;
  if (existingAddrs && existingAddrs.length > 0) {
    addressId = existingAddrs[0]!.id;
  } else {
    console.log("Creating primary company address...");
    const { data: newAddr, error: addrErr } = await admin
      .from("company_addresses")
      .insert({
        company_id: companyId,
        label: "Headquarters & Warehouse",
        contact_name: "Alex Buyer",
        phone: "+1 305-555-0144",
        line1: "100 Commercial Blvd",
        city: "Miami",
        region: "FL",
        postal_code: "33101",
        country_code: "US",
        is_billing: true,
        is_default_shipping: true,
      })
      .select("id")
      .single();

    if (addrErr || !newAddr) throw new Error(`Failed to create address: ${addrErr?.message}`);
    addressId = newAddr.id;

    console.log("Creating delivery location...");
    await admin.from("company_locations").insert({
      company_id: companyId,
      address_id: addressId,
      name: "Main Receiving Dock",
      receiving_instructions: "Deliveries accepted Monday to Friday 7am - 3pm. Dock height bay.",
      has_dock: true,
      liftgate_required: false,
      appointment_required: false,
      active: true,
    });
  }

  // 5. Ensure commerce policy
  await admin.from("company_commerce_policies").upsert({
    company_id: companyId,
    allow_card: true,
    allow_ach: true,
    allow_manual: false,
    allow_terms: false,
    release_policy: "PAYMENT_SUCCEEDED",
    payment_terms_days: 0,
    credit_limit_minor: 0,
  });

  // 6. Link user to company as OWNER/BUYER
  console.log("Linking buyer membership in company_users...");
  const { error: userErr } = await admin.from("company_users").upsert(
    {
      company_id: companyId,
      user_id: userId,
      role: "OWNER",
      active: true,
    },
    { onConflict: "company_id,user_id" }
  );

  if (userErr) throw new Error(`Failed to link membership: ${userErr.message}`);

  console.log("==================================================");
  console.log("✅ Buyer Account Successfully Created & Configured!");
  console.log("==================================================");
  console.log(`URL:          http://localhost:3000/login`);
  console.log(`Email:        ${email}`);
  console.log(`Password:     ${password}`);
  console.log(`Company:      ${companyName} (APPROVED)`);
  console.log(`Role:         OWNER (full buyer & order privileges)`);
  console.log("==================================================");
}

run().catch((err) => {
  console.error("❌ Failed to provision buyer account:", err);
  process.exit(1);
});
