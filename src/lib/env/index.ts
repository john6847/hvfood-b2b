import { z } from "zod";

/**
 * Environment access is centralized so a missing or malformed variable fails
 * with a clear message instead of deep inside a request.
 *
 * The app runs in one of two modes, decided entirely by whether Supabase is
 * configured:
 *
 * - **Connected**: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   are set. Real authentication, real data, RLS in force.
 * - **Static preview**: neither is set. The app serves fixtures so the design
 *   can be reviewed and deployed without a database. No sign-in, no writes.
 *
 * Static preview is never a fallback for a failed connection: if Supabase is
 * configured at all, every request goes through it and a misconfiguration is
 * an error rather than a silent downgrade to fake data.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when no Supabase project is configured for this deployment. */
export const STATIC_PREVIEW = !supabaseUrl && !supabaseAnonKey;

const appUrlSchema = z.url().default("http://localhost:3000");

export const publicEnv = {
  NEXT_PUBLIC_APP_URL: appUrlSchema.parse(process.env.NEXT_PUBLIC_APP_URL ?? undefined),
} as const;

const supabaseSchema = z.object({
  url: z.url("NEXT_PUBLIC_SUPABASE_URL must be a URL"),
  anonKey: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

let cachedSupabaseEnv: z.infer<typeof supabaseSchema> | null = null;

/**
 * Supabase connection details. Throws in static preview, so any code path
 * that reaches a database client without a project configured fails loudly
 * rather than returning empty results.
 */
export function supabaseEnv() {
  if (STATIC_PREVIEW) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, " +
        "or use the static preview paths that do not touch the database.",
    );
  }
  if (!cachedSupabaseEnv) {
    const result = supabaseSchema.safeParse({ url: supabaseUrl, anonKey: supabaseAnonKey });
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      throw new Error(`Invalid Supabase environment: ${issues}`);
    }
    cachedSupabaseEnv = result.data;
  }
  return cachedSupabaseEnv;
}

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser");
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }
  return cachedServerEnv;
}
