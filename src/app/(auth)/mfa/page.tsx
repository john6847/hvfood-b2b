import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getMfaState, getStaffContext } from "@/modules/identity/service";
import { MfaPanel } from "./mfa-panel";

export const metadata: Metadata = { title: "Two-step verification" };

/**
 * Staff must hold an aal2 session before the admin renders anything.
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
          ? "Staff accounts require an authenticator app. Scan the code with an app such as 1Password, Google Authenticator or Authy, then enter the six-digit code."
          : "Open your authenticator app and enter the current six-digit code for Horizon Vert wholesale."}
      </p>
      <div className="mt-8">
        <MfaPanel mode={mode} />
      </div>
    </div>
  );
}
