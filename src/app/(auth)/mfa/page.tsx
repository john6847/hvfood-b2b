import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getMfaState, getStaffContext } from "@/modules/identity/service";
import { MfaPanel } from "./mfa-panel";

export const metadata: Metadata = { title: "Two-step verification" };

/**
 * Staff reach aal2 here. Enforcement depends on the database policy
 * switch; when it is off the page is still offered but can be skipped.
 * Mode is decided server-side from the verified session:
 * - a verified factor exists and the session is aal1: challenge it
 * - no factor yet: enroll one
 */
export default async function MfaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  const staff = await getStaffContext();
  if (!staff) redirect("/wholesale/dashboard");

  const mfa = await getMfaState();
  if (mfa.currentLevel === "aal2") redirect("/admin");

  const mode = mfa.nextLevel === "aal2" ? "verify" : "enroll";

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        {mode === "enroll" ? "Set up two-step verification" : "Enter your verification code"}
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">
        {mode === "enroll"
          ? "Scan the code with an authenticator app such as 1Password, Google Authenticator or Authy, then enter the six-digit code."
          : "Open your authenticator app and enter the current six-digit code for Horizon Vert wholesale."}
      </p>
      <div className="mt-8">
        <MfaPanel mode={mode} />
      </div>
      {!staff.mfaRequired ? (
        <p className="mt-6 text-sm text-foreground-muted">
          Two-step verification is optional right now.{" "}
          <Link href="/admin" className="text-primary underline underline-offset-4">
            Continue to the admin without it
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
