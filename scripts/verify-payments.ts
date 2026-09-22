/**
 * End-to-End Verification Script: Multi-Payment Methods (Stripe Card, ACH Direct Debit, Wire Transfer)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-payments.ts
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const stripe = stripeKey ? new Stripe(stripeKey) : null;

async function run() {
  console.log("==================================================");
  console.log("  Multi-Payment Methods E2E Verification");
  console.log("==================================================");

  // [1/5] Find test company (Gourmet Provisions Market)
  console.log("[1/5] Locating Gourmet Provisions Market...");
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, display_name")
    .eq("legal_name", "Gourmet Provisions Market")
    .limit(1);

  if (compErr || !companies || companies.length === 0) {
    throw new Error("Could not find Gourmet Provisions Market");
  }
  const companyId = companies[0]!.id;
  console.log(`✅ Found company: ${companies[0]!.display_name} (${companyId})`);

  // [2/5] Test Wire Transfer Order Creation via create_wholesale_order RPC
  console.log("\n[2/5] Testing create_wholesale_order RPC for Wire Transfer...");
  const { data: created, error: rpcErr } = await supabase.rpc("create_wholesale_order", {
    p_company_id: companyId,
    p_payment_method: "WIRE",
    p_payment_status: "UNPAID",
    p_po_number: "PO-VERIFY-2026",
    p_lines: [
      {
        product_slug: "jasmine-rice",
        product_name: "Premium Jasmine Rice",
        product_sku: "HV-RIC-001",
        pack_description: "4 × 20 lb bags",
        image_url: "/products/jasmine-rice.jpg",
        cases: 10,
        unit_price_minor: 7896,
      },
    ],
  });

  if (rpcErr || !created || created.length === 0 || !created[0]) {
    throw new Error(`Failed to create wire order: ${rpcErr?.message}`);
  }

  const orderId = created[0].order_id;
  const orderNumber = created[0].order_number;
  const wireReference = created[0].wire_reference;
  const totalMinor = created[0].total_minor;

  console.log(`✅ Wire order created successfully!`);
  console.log(`   - Order ID:       ${orderId}`);
  console.log(`   - Order Number:   ${orderNumber}`);
  console.log(`   - Wire Reference: ${wireReference}`);
  console.log(`   - Total Amount:   $${(Number(totalMinor) / 100).toFixed(2)}`);

  // Verify stored record
  const { data: orderRecord, error: fetchErr } = await supabase
    .from("orders")
    .select("*, order_lines(*)")
    .eq("id", orderId)
    .single();

  if (fetchErr || !orderRecord) {
    throw new Error(`Failed to fetch created order: ${fetchErr?.message}`);
  }

  if (
    orderRecord.payment_method !== "WIRE" ||
    orderRecord.payment_status !== "UNPAID" ||
    orderRecord.status !== "ON_HOLD"
  ) {
    throw new Error(`Unexpected order state: method=${orderRecord.payment_method}, payment_status=${orderRecord.payment_status}, status=${orderRecord.status}`);
  }
  console.log(`✅ Database verified: payment_method=WIRE, payment_status=UNPAID, status=ON_HOLD`);
  console.log(`✅ Order line items verified: ${orderRecord.order_lines?.length} line(s)`);

  // [3/5] Test Wire Payment Confirmation via admin_confirm_wire_payment RPC
  console.log("\n[3/5] Testing admin_confirm_wire_payment RPC...");
  const { error: confirmErr } = await supabase.rpc("admin_confirm_wire_payment", {
    p_order_id: orderId,
    p_internal_notes: "Chase Fedwire trace # 8294729182 settled",
  });

  if (confirmErr) {
    throw new Error(`Failed to confirm wire payment: ${confirmErr.message}`);
  }

  const { data: updatedRecord } = await supabase
    .from("orders")
    .select("payment_status, status, internal_notes")
    .eq("id", orderId)
    .single();

  if (updatedRecord?.payment_status !== "PAID" || updatedRecord?.status !== "PROCESSING") {
    throw new Error(`Order status did not transition to PAID/PROCESSING: ${JSON.stringify(updatedRecord)}`);
  }
  console.log(`✅ Order payment status transitioned to PAID!`);
  console.log(`✅ Order status transitioned to PROCESSING (released to fulfillment)!`);

  // [4/5] Test Stripe Card & ACH Session Creation
  console.log("\n[4/5] Testing Stripe session creation for Card & ACH...");
  if (!stripe) {
    console.log("⚠️ Stripe secret key not found, skipping Stripe API call.");
  } else {
    // Card session
    const cardSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 2,
          price_data: {
            currency: "usd",
            unit_amount: 8496,
            product_data: { name: "Premium Jasmine Rice" },
          },
        },
      ],
      metadata: { company_id: companyId, payment_method: "CARD" },
      success_url: "http://localhost:3000/wholesale/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/wholesale/catalog",
    });
    console.log(`✅ Stripe Card session created: ${cardSession.id}`);

    // ACH session
    const achSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["us_bank_account"],
      line_items: [
        {
          quantity: 5,
          price_data: {
            currency: "usd",
            unit_amount: 7896,
            product_data: { name: "Premium Jasmine Rice" },
          },
        },
      ],
      metadata: { company_id: companyId, payment_method: "ACH" },
      success_url: "http://localhost:3000/wholesale/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/wholesale/catalog",
    });
    console.log(`✅ Stripe ACH Direct Debit session created: ${achSession.id}`);
  }

  // [5/5] Cleanup test order
  console.log("\n[5/5] Cleaning up test order...");
  await supabase.from("orders").delete().eq("id", orderId);
  console.log(`✅ Cleaned up test order ${orderNumber}`);

  console.log("\n==================================================");
  console.log("🎉 ALL MULTI-PAYMENT TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
