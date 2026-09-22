"use client";

import { useActionState, useState } from "react";
import { Building2, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { formatMinorUsd, cn } from "@/lib/utils";
import { casePriceForQuantity, type CatalogProduct } from "@/modules/catalog/fixtures";
import { startCheckout, type CheckoutState } from "@/modules/payments/checkout";
import { QuantityInput } from "./quantity-input";

type PaymentMethodKey = "card" | "ach" | "wire";

const PAYMENT_OPTIONS: {
  id: PaymentMethodKey;
  label: string;
  description: string;
  badge: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Instant card capture via Stripe",
    badge: "Instant",
    icon: CreditCard,
  },
  {
    id: "ach",
    label: "ACH Direct Debit",
    description: "US bank account transfer (1–3 days)",
    badge: "Bank Debit",
    icon: Landmark,
  },
  {
    id: "wire",
    label: "Wire Transfer",
    description: "Domestic / SWIFT corporate wire",
    badge: "Corporate",
    icon: Building2,
  },
];

/**
 * Product Order & Checkout Panel.
 * Supports multiple payment methods (Stripe Card, ACH Direct Debit, and Corporate Wire Transfer).
 */
export function ProductOrderPanel({ product, initialCases }: { product: CatalogProduct; initialCases: number }) {
  const [cases, setCases] = useState(initialCases);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>("card");
  const [poNumber, setPoNumber] = useState("");
  const [state, checkout, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});

  const unit = casePriceForQuantity(product, cases);
  const total = unit * cases;
  const units = cases * product.unitsPerCase;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          product.available ? "text-success-fg" : "text-danger-fg"
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {product.available ? "In stock · Available by the case" : "Temporarily unavailable"}
      </p>

      {/* Quantity and Pricing Row */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <QuantityInput value={cases} onChange={setCases} label={`Cases of ${product.name}`} />
          <p className="mt-2 text-xs text-foreground-muted">
            {cases} {cases === 1 ? "case" : "cases"} × {product.unitsPerCase} units = {units} units
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="tabular text-2xl font-bold text-foreground">{formatMinorUsd(total)}</p>
          <p className="text-xs text-foreground-muted">
            {cases} × {formatMinorUsd(unit)} / case
          </p>
        </div>
      </div>

      <form action={checkout} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="cases" value={cases} />
        <input type="hidden" name="paymentMethod" value={selectedMethod} />

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
            Payment Method
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMethod(opt.id)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground shadow-xs"
                      : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span
                      className={cn(
                        "p-1.5 rounded-md",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground-muted"
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        "text-3xs font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-foreground-subtle"
                      )}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground text-xs">{opt.label}</span>
                  <span className="mt-0.5 text-3xs text-foreground-muted leading-tight">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PO Number (Optional) */}
        <div>
          <label htmlFor="poNumber" className="block text-xs font-medium text-foreground-muted mb-1">
            Purchase Order # <span className="text-foreground-subtle font-normal">(Optional)</span>
          </label>
          <input
            id="poNumber"
            name="poNumber"
            type="text"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="e.g. PO-2026-0922"
            maxLength={100}
            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

        {/* Dynamic Action Button */}
        <Button
          type="submit"
          size="lg"
          disabled={pending || !product.available}
          className="w-full mt-1 flex items-center justify-center gap-2"
        >
          {selectedMethod === "card" && <CreditCard className="size-4" aria-hidden />}
          {selectedMethod === "ach" && <Landmark className="size-4" aria-hidden />}
          {selectedMethod === "wire" && <Building2 className="size-4" aria-hidden />}

          {pending
            ? selectedMethod === "wire"
              ? "Generating Wire Order..."
              : "Opening secure checkout..."
            : selectedMethod === "card"
              ? `Pay with Card · ${formatMinorUsd(total)}`
              : selectedMethod === "ach"
                ? `Pay with ACH Direct Debit · ${formatMinorUsd(total)}`
                : `Place Order via Wire Transfer · ${formatMinorUsd(total)}`}
        </Button>

        {/* Contextual Helper Note */}
        <p className="text-2xs text-foreground-muted text-center leading-relaxed">
          {selectedMethod === "card" &&
            "Test mode: Pay securely with Visa, Mastercard or Amex via Stripe test mode."}
          {selectedMethod === "ach" &&
            "Test mode: Direct US bank debit via Stripe Financial Connections. 1–3 business days clearance."}
          {selectedMethod === "wire" &&
            "Instant order reservation. Official bank remittance voucher and reference code provided immediately."}
        </p>
      </form>
    </div>
  );
}
