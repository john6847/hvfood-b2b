import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { getStripe } from "@/integrations/stripe/client";
import { createSessionClient } from "@/lib/supabase/server";
import { formatMinorUsd } from "@/lib/utils";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Payment received" };

/**
 * Where Stripe Checkout returns the buyer. The session is read from Stripe
 * on the server, authenticated against the active company, and persisted
 * to the orders database table.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const membership = await getActiveMembership();
  if (membership?.companyStatus !== "APPROVED") redirect("/wholesale/dashboard");

  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();
  if (!sessionId || !sessionId.startsWith("cs_") || !stripe) notFound();

  const session = await stripe.checkout.sessions
    .retrieve(sessionId, { expand: ["line_items"] })
    .catch(() => null);
  if (!session || session.metadata?.company_id !== membership.companyId) notFound();

  const paid = session.payment_status === "paid";
  const lines = session.line_items?.data ?? [];
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const paymentMethod = session.metadata?.payment_method === "ACH" ? "ACH" : "CARD";
  const paymentStatus = paid ? "PAID" : "PROCESSING";

  // Reconcile order into Supabase database
  let orderNumber: string | null = null;
  try {
    const supabase = await createSessionClient();
    // Check if order already recorded for this stripe session
    const { data: existing } = await supabase
      .from("orders")
      .select("order_number")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      orderNumber = existing.order_number;
    } else {
      // Record new order
      const firstLine = lines[0];
      const cases = Number(session.metadata?.cases || firstLine?.quantity || 1);
      const unitPrice = cases > 0 ? Math.round((session.amount_total ?? 0) / cases) : 0;

      const { data: created } = await supabase.rpc("create_wholesale_order", {
        p_company_id: membership.companyId,
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_po_number: session.metadata?.po_number || undefined,
        p_stripe_session_id: sessionId,
        p_stripe_payment_intent_id: paymentIntent ?? undefined,
        p_lines: [
          {
            product_slug: session.metadata?.slug || "wholesale-product",
            product_name: firstLine?.description || "Wholesale Product",
            product_sku: session.metadata?.sku || "",
            pack_description: "",
            image_url: null,
            cases,
            unit_price_minor: unitPrice,
          },
        ],
      });

      if (created && created.length > 0 && created[0]) {
        orderNumber = created[0].order_number;
      }
    }
  } catch (err) {
    console.error("Failed to reconcile order into Supabase:", err);
  }

  return (
    <>
      <PageHeading
        eyebrow={membership.companyDisplayName}
        title={paid ? "Payment received" : "Payment processing"}
        description={
          paid
            ? `Thanks for your order. Stripe has confirmed the payment${orderNumber ? ` for order ${orderNumber}` : ""}.`
            : "Stripe ACH payment is processing. Bank transfers typically clear within 1–3 business days."
        }
        action={<StatusPill tone={paid ? "success" : "warning"}>{paid ? "Paid" : "Processing"}</StatusPill>}
      />

      {paymentMethod === "ACH" && !paid ? (
        <Notice tone="warning" className="mb-6" title="Bank Transfer Processing">
          Your ACH direct debit is being processed by your bank. Your order has been placed and items are
          reserved. We will begin fulfillment once funds settle.
        </Notice>
      ) : (
        <Notice tone="info" className="mb-6">
          Test mode purchase. Your order is registered in the system and appears in your wholesale order history.
        </Notice>
      )}

      <Panel>
        <PanelHeader title="Summary" />
        <PanelBody>
          <DefinitionList
            items={[
              ...(orderNumber ? [{ term: "Order number", value: <strong>{orderNumber}</strong> }] : []),
              { term: "Payment method", value: paymentMethod === "ACH" ? "ACH Direct Debit" : "Credit / Debit Card" },
              ...lines.map((line) => ({
                term: line.description ?? "Item",
                value: `${line.quantity ?? 0} ${line.quantity === 1 ? "case" : "cases"} · ${formatMinorUsd(line.amount_total)}`,
              })),
              { term: "Total", value: <strong>{formatMinorUsd(session.amount_total ?? 0)}</strong> },
              { term: "Receipt sent to", value: session.customer_details?.email ?? "Not provided" },
              { term: "Stripe payment", value: <span className="font-mono text-xs">{paymentIntent ?? session.id}</span> },
            ]}
          />
        </PanelBody>
      </Panel>

      <div className="mt-6 flex flex-wrap gap-3">
        {orderNumber ? (
          <ButtonLink href={`/wholesale/orders/${orderNumber}`}>
            View Order {orderNumber}
          </ButtonLink>
        ) : null}
        <ButtonLink href="/wholesale/orders" variant={orderNumber ? "secondary" : "primary"}>
          All Orders
        </ButtonLink>
        <ButtonLink href="/wholesale/catalog" variant="secondary">
          Keep shopping
        </ButtonLink>
      </div>
    </>
  );
}
