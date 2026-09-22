import { resolveAppUrl, resolveSupabaseMode } from "./resolve";

/**
 * Environment access is centralized so configuration problems surface in
 * one place with a clear message.
 *
 * The app runs in one of two modes, decided by whether Supabase is
 * configured:
 *
 * - **Connected**: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   are both set. Real authentication, real data, RLS in force.
 * - **Static preview**: neither is set. The app serves fixtures so the
 *   design can be reviewed and deployed without a database.
 *
 * Nothing here throws while the module loads: a bad value must never be
 * able to fail a build. Half-configured Supabase is reported when a
 * database client is actually requested, so it can never quietly downgrade
 * to fake data.
 */

// Next.js inlines NEXT_PUBLIC_* only when referenced explicitly by name.
const mode = resolveSupabaseMode({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

/** True when no Supabase project is configured for this deployment. */
export const STATIC_PREVIEW = mode.kind === "static";

export const publicEnv = {
  NEXT_PUBLIC_APP_URL: resolveAppUrl({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
  }),
} as const;

/**
 * Supabase connection details. Throws when the app is not connected, so
 * any code path that reaches a database client without a project
 * configured fails loudly rather than returning empty results.
 */
export function supabaseEnv() {
  if (mode.kind === "connected") return { url: mode.url, anonKey: mode.anonKey };

  if (mode.kind === "incomplete") {
    throw new Error(
      `Supabase is partly configured. Fix or remove: ${mode.missing.join(", ")}. ` +
        "Set both variables to connect, or neither to run the static preview.",
    );
  }

  throw new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY), " +
      "or use the static preview paths that do not touch the database.",
  );
}

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser");
  }
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return {
    SUPABASE_SERVICE_ROLE_KEY: key ? key : undefined,
    SUPABASE_SECRET_KEY: key ? key : undefined,
  };
}

/**
 * Stripe secret key, or null when Stripe is not configured. Only test-mode
 * keys are accepted until the purchasing release: checkout is for trying
 * the flow with test cards, and a live key here would take real money.
 */
export function stripeSecretKey(): string | null {
  if (typeof window !== "undefined") {
    throw new Error("stripeSecretKey() was called in the browser");
  }
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a test-mode key (sk_test_...). Live keys are not accepted yet.");
  }
  return key;
}
