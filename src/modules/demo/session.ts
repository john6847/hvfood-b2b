/**
 * Static preview sign-in. With no database there is no real session, so a
 * cookie records which test account is signed in. The cookie holds only the
 * account key, never a password.
 *
 * This is test scaffolding for the static preview, not authentication: the
 * data behind it is fixtures, and it is unreachable once Supabase is
 * configured.
 */

export const DEMO_SESSION_COOKIE = "hv_demo_session";

export const DEMO_ACCOUNT_KEYS = ["buyer", "admin"] as const;
export type DemoAccountKey = (typeof DEMO_ACCOUNT_KEYS)[number];

export function parseDemoAccountKey(value: string | undefined): DemoAccountKey | null {
  return (DEMO_ACCOUNT_KEYS as readonly string[]).includes(value ?? "") ? (value as DemoAccountKey) : null;
}
