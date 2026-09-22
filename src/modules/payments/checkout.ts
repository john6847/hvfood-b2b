"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getStripe } from "@/integrations/stripe/client";
import { publicEnv } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { getDbProductBySlug } from "@/modules/catalog/catalog-service";
import { casePriceForQuantity, findProductBySlug, hasPricing } from "@/modules/catalog/fixtures";
import { getCurrentUser, requireApprovedMembership } from "@/modules/identity/service";

export type CheckoutState = { error?: string };

const checkoutSchema = z.object({
  slug: z.string().min(1),
  cases: z.coerce.number().int().min(1).max(999),
  paymentMethod: z.enum(["card", "ach", "wire"]).default("card"),
  poNumber: z.string().max(100).optional(),
});

/**
 * Starts checkout for a wholesale order supporting multiple payment methods:
 * 1. Stripe (Card) — Instant capture via Stripe Checkout
 * 2. ACH — US Bank Account Direct Debit via Stripe
 * 3. Wire Transfer — Direct B2B Bank Wire with Remittance Voucher
 */
export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const membership = await requireApprovedMembership();
  const user = await getCurrentUser();

  const parsed = checkoutSchema.safeParse({
    slug: formData.get("slug"),
    cases: formData.get("cases"),
    paymentMethod: formData.get("paymentMethod") ?? "card",
    poNumber: formData.get("poNumber") ?? undefined,
  });

  if (!parsed.success) return { error: "Choose between 1 and 999 cases." };

  const { slug, cases, paymentMethod, poNumber } = parsed.data;

  // Resolve product with company pricing
  let product = await getDbProductBySlug(slug, membership.companyId);
  if (!product) {
    product = findProductBySlug(slug) ?? null;
  }

  if (!product) return { error: "This product is no longer available." };
  if (!product.available) return { error: "This product is temporarily unavailable." };
  if (!hasPricing(product)) return { error: "Wholesale pricing is not available for this account." };

  const unitPrice = casePriceForQuantity(product, cases);

  // --- Path 1: Corporate Wire Transfer ---
  if (paymentMethod === "wire") {
    let orderNumber: string | null = null;
    try {
      const supabase = await createSessionClient();
      const { data, error } = await supabase.rpc("create_wholesale_order", {
        p_company_id: membership.companyId,
        p_payment_method: "WIRE",
        p_payment_status: "UNPAID",
        p_po_number: poNumber?.trim() || undefined,
        p_lines: [
          {
            product_slug: product.slug,
            product_name: product.name,
            product_sku: product.sku,
            pack_description: product.pack,
            image_url: product.image,
            cases,
            unit_price_minor: unitPrice,
          },
        ],
      });

      if (error || !data || data.length === 0 || !data[0]) {
        console.error("Failed to create wire order in Supabase:", error);
        return { error: error?.message || "Could not create wire order. Try again." };
      }

      orderNumber = data[0].order_number;
    } catch (err: unknown) {
      console.error("Wire order submission exception:", err);
      const msg = err instanceof Error ? err.message : "Could not create wire order.";
      return { error: msg };
    }

    if (orderNumber) {
      redirect(`/wholesale/orders/${orderNumber}?wire=1`);
    }
  }

  // --- Path 2 & 3: Stripe Card or ACH Direct Debit ---
  const stripe = getStripe();
  if (!stripe) return { error: "Checkout is not set up yet. Add a Stripe test key to STRIPE_SECRET_KEY." };

  const origin = publicEnv.NEXT_PUBLIC_APP_URL;
  const metadata = {
    company_id: membership.companyId,
    company_name: membership.companyDisplayName,
    sku: product.sku,
    slug: product.slug,
    cases: String(cases),
    payment_method: paymentMethod === "ach" ? "ACH" : "CARD",
    po_number: poNumber?.trim() || "",
  };

  const paymentMethodTypes: ("card" | "us_bank_account")[] =
    paymentMethod === "ach" ? ["us_bank_account"] : ["card"];

  let url: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      customer_email: user?.email ?? undefined,
      client_reference_id: membership.companyId,
      line_items: [
        {
          quantity: cases,
          price_data: {
            currency: "usd",
            unit_amount: unitPrice,
            product_data: {
              name: product.name,
              description: `${product.sku} · ${product.pack} per case`,
              metadata: { sku: product.sku },
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        description: `${membership.companyDisplayName}: ${cases} × ${product.name} (${paymentMethod === "ach" ? "ACH" : "Card"})`,
        metadata,
      },
      success_url: `${origin}/wholesale/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/wholesale/products/${product.slug}?cases=${cases}`,
    });
    url = session.url;
  } catch (error) {
    console.error("Stripe checkout session failed", error);
    return { error: "Stripe could not start checkout. Try again in a moment." };
  }

  if (!url) return { error: "Stripe could not start checkout. Try again in a moment." };
  redirect(url);
}
