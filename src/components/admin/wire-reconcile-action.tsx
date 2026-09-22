"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { confirmWirePaymentAction } from "@/modules/orders/actions";

export function WireReconcileAction({
  orderId,
  orderNumber,
  totalFormatted,
}: {
  orderId: string;
  orderNumber: string;
  totalFormatted: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmWirePaymentAction(orderId, notes);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    });
  }

  if (success) {
    return (
      <Notice tone="success" title="Payment Reconciled">
        Wire transfer confirmed. Order status updated to Paid and moved to Processing.
      </Notice>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5"
      >
        <CheckCircle2 className="size-4" aria-hidden />
        Confirm Wire Received
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <span className="font-bold text-foreground text-sm">Reconcile Wire Transfer ({orderNumber})</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-foreground-muted hover:text-foreground cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <p className="text-foreground-muted mb-3">
        Confirm that incoming bank wire of <strong className="text-foreground">{totalFormatted}</strong> has settled
        in the corporate account. This will mark the order as <span className="font-semibold text-success-fg">PAID</span> and release it to the fulfillment queue.
      </p>

      <div className="mb-3">
        <label htmlFor="wireNotes" className="block text-3xs uppercase font-semibold text-foreground-muted mb-1">
          Internal Reconcile Notes / Bank Ref (Optional)
        </label>
        <input
          id="wireNotes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. JPMorgan Wire trace # 98472918"
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {error ? (
        <div className="mb-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={isPending}
          onClick={handleConfirm}
          className="flex items-center gap-1.5"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
          {isPending ? "Confirming Wire..." : "Confirm Wire Received & Mark Paid"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
