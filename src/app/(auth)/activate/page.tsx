import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Activate your account" };

/**
 * Invitation acceptance lands here in Phase 2 (accounts). The route exists
 * now so approval emails can be designed against a stable address.
 */
export default function ActivatePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Activate your account</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Approved businesses receive an invitation email with a single-use activation link.
      </p>
      <Notice tone="info" className="mt-6" title="Activation opens with the accounts release">
        Invitation links are issued once application review is live. Until then, staff set up
        accounts directly. If you were expecting an invitation, reply to the email you received
        from the wholesale team.
      </Notice>
      <p className="mt-8 text-sm text-foreground-muted">
        Already activated?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
