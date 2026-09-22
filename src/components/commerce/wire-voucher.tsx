"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { HORIZON_VERT_WIRE_DETAILS } from "@/modules/payments/wire";
import { formatMinorUsd } from "@/lib/utils";

export function WireRemittanceVoucher({
  orderNumber,
  wireReference,
  totalMinor,
  companyName,
}: {
  orderNumber: string;
  wireReference?: string | null;
  totalMinor: number;
  companyName: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const refCode = wireReference || `HV-WIRE-${orderNumber.replace("HV-", "")}`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-surface p-5 sm:p-6 shadow-xs print:border-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="eyebrow text-primary">Official Remittance Voucher</span>
          <h3 className="text-lg font-bold text-foreground">Corporate Wire Transfer Instructions</h3>
          <p className="text-xs text-foreground-muted mt-0.5">
            Order {orderNumber} · Reserved for {companyName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors print:hidden cursor-pointer"
        >
          <Printer className="size-3.5" aria-hidden />
          Print Voucher
        </button>
      </div>

      {/* Wire Reference Highlight Box */}
      <div className="mt-4 rounded-md bg-primary/10 border border-primary/25 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-3xs uppercase tracking-wider font-bold text-primary block">
            Payment Reference Code (Required in Wire Memo / Field 70)
          </span>
          <span className="font-mono text-base font-bold text-foreground tracking-wider select-all">
            {refCode}
          </span>
        </div>
        <button
          type="button"
          onClick={() => copy(refCode, "ref")}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
        >
          {copied === "ref" ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy Code
            </>
          )}
        </button>
      </div>

      {/* Banking Table */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 text-xs">
        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <span className="text-foreground-muted block text-3xs uppercase font-semibold">Beneficiary Name</span>
          <span className="font-medium text-foreground text-xs mt-0.5 block select-all">
            {HORIZON_VERT_WIRE_DETAILS.beneficiaryName}
          </span>
        </div>

        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <span className="text-foreground-muted block text-3xs uppercase font-semibold">Total Amount Due</span>
          <span className="font-bold text-foreground text-sm mt-0.5 block tabular">
            {formatMinorUsd(totalMinor)} USD
          </span>
        </div>

        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <span className="text-foreground-muted block text-3xs uppercase font-semibold">Receiving Bank</span>
          <span className="font-medium text-foreground text-xs mt-0.5 block">
            {HORIZON_VERT_WIRE_DETAILS.bankName}
          </span>
          <span className="text-3xs text-foreground-muted block mt-0.5">
            {HORIZON_VERT_WIRE_DETAILS.bankAddress}
          </span>
        </div>

        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted block text-3xs uppercase font-semibold">ABA / Routing Number</span>
            <button
              type="button"
              onClick={() => copy(HORIZON_VERT_WIRE_DETAILS.routingNumber, "aba")}
              className="text-primary hover:underline text-3xs cursor-pointer font-medium"
            >
              {copied === "aba" ? "Copied" : "Copy"}
            </button>
          </div>
          <span className="font-mono font-semibold text-foreground text-xs mt-0.5 block select-all">
            {HORIZON_VERT_WIRE_DETAILS.routingNumber}
          </span>
        </div>

        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted block text-3xs uppercase font-semibold">Account Number</span>
            <button
              type="button"
              onClick={() => copy(HORIZON_VERT_WIRE_DETAILS.accountNumber, "acct")}
              className="text-primary hover:underline text-3xs cursor-pointer font-medium"
            >
              {copied === "acct" ? "Copied" : "Copy"}
            </button>
          </div>
          <span className="font-mono font-semibold text-foreground text-xs mt-0.5 block select-all">
            {HORIZON_VERT_WIRE_DETAILS.accountNumber}
          </span>
        </div>

        <div className="rounded-md border border-border p-3 bg-surface-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted block text-3xs uppercase font-semibold">SWIFT / BIC (International)</span>
            <button
              type="button"
              onClick={() => copy(HORIZON_VERT_WIRE_DETAILS.swiftBic, "swift")}
              className="text-primary hover:underline text-3xs cursor-pointer font-medium"
            >
              {copied === "swift" ? "Copied" : "Copy"}
            </button>
          </div>
          <span className="font-mono font-semibold text-foreground text-xs mt-0.5 block select-all">
            {HORIZON_VERT_WIRE_DETAILS.swiftBic}
          </span>
        </div>
      </div>

      <p className="mt-4 text-2xs text-foreground-muted leading-relaxed">
        <strong>Important:</strong> {HORIZON_VERT_WIRE_DETAILS.instructions}
      </p>
    </div>
  );
}
