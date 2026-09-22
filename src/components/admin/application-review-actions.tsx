"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { approveApplicationAction, rejectApplicationAction } from "@/app/(admin)/admin/applications/[id]/actions";

type Tier = {
  id: string;
  code: string;
  name: string;
};

export function ApplicationReviewActions({
  applicationId,
  status,
  companyId,
  pricingTiers,
}: {
  applicationId: string;
  status: string;
  companyId: string | null;
  pricingTiers: Tier[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedTier, setSelectedTier] = useState(
    pricingTiers.find((t) => t.code === "STANDARD")?.id || pricingTiers[0]?.id || "",
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [mode, setMode] = useState<"IDLE" | "APPROVING" | "REJECTING">("IDLE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<{
    companyId: string;
    invitationToken: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("applicationId", applicationId);
    formData.set("pricingTierId", selectedTier);
    if (internalNotes) formData.set("internalNotes", internalNotes);

    startTransition(async () => {
      const res = await approveApplicationAction(formData);
      if (res.ok && res.companyId && res.invitationToken) {
        setApprovalResult({
          companyId: res.companyId,
          invitationToken: res.invitationToken,
        });
        setMode("IDLE");
      } else {
        setErrorMsg(res.error || "Failed to approve application");
      }
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("applicationId", applicationId);
    if (internalNotes) formData.set("internalNotes", internalNotes);
    if (customerMessage) formData.set("customerMessage", customerMessage);

    startTransition(async () => {
      const res = await rejectApplicationAction(formData);
      if (res.ok) {
        setMode("IDLE");
      } else {
        setErrorMsg(res.error || "Failed to reject application");
      }
    });
  };

  const handleCopyLink = () => {
    if (!approvalResult) return;
    const origin = window.location.origin;
    const inviteUrl = `${origin}/activate?token=${approvalResult.invitationToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (approvalResult) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/activate?token=${approvalResult.invitationToken}`;

    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-5 space-y-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="font-semibold text-sm sm:text-base">Application Approved & Company Created</h3>
        </div>
        <p className="text-xs sm:text-sm text-foreground-muted">
          A new wholesale company record has been provisioned and an owner invitation token has been generated.
        </p>

        <div className="space-y-1.5">
          <label className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
            Owner Activation Link (Valid for 7 Days)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="h-8 flex-1 rounded border border-border bg-surface px-2.5 font-mono text-xs text-foreground select-all"
            />
            <Button size="sm" variant="secondary" onClick={handleCopyLink} className="gap-1">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Link
            href={`/admin/customers/${approvalResult.companyId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Go to Company Record
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium text-sm">Application Approved</span>
        </div>
        <p className="text-xs text-foreground-muted">
          This account has been approved and its company profile is active.
        </p>
        {companyId && (
          <Link
            href={`/admin/customers/${companyId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            View Customer Account
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 space-y-2">
        <div className="flex items-center gap-2 text-danger-fg">
          <XCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Application Rejected</span>
        </div>
        <p className="text-xs text-foreground-muted">
          This wholesale application was reviewed and rejected.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground">Review Decisions</h3>

      {errorMsg && (
        <Notice tone="danger" title="Action Failed">
          {errorMsg}
        </Notice>
      )}

      {mode === "IDLE" && (
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setMode("APPROVING")}
          >
            Approve Application
          </Button>
          <Button
            variant="ghost"
            className="w-full text-danger-fg hover:bg-danger-bg/20"
            onClick={() => setMode("REJECTING")}
          >
            Reject Application
          </Button>
        </div>
      )}

      {mode === "APPROVING" && (
        <form onSubmit={handleApprove} className="space-y-4">
          <Field label="Assign Pricing Tier" htmlFor="pricingTier">
            <Select
              id="pricingTier"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              required
            >
              {pricingTiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Internal Review Notes" htmlFor="internalNotes" hint="Optional, visible only to operations staff">
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Verified business license on state registry. Good credit profile."
              rows={2}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("IDLE")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </div>
        </form>
      )}

      {mode === "REJECTING" && (
        <form onSubmit={handleReject} className="space-y-4">
          <Field label="Internal Rejection Reason" htmlFor="internalNotes" hint="Why was this application rejected?">
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Residential address, unverified business license, or out-of-territory."
              rows={2}
              required
            />
          </Field>

          <Field label="Customer-Facing Message" htmlFor="customerMessage" hint="Optional note included in the notification">
            <Textarea
              id="customerMessage"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder="Thank you for your interest. At this time we are unable to approve your wholesale account because..."
              rows={2}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("IDLE")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-danger hover:bg-danger/90 text-danger-fg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
