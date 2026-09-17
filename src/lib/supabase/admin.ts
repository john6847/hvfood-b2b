import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv, supabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Rules of use:
 * - Only inside server code that has already verified the caller's
 *   permission through the identity module.
 * - Never for ordinary reads; the session client with RLS is the default.
 * - Possession of this key is never sufficient authorization on its own.
 */
export function createAdminClient() {
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient<Database>(supabaseEnv().url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
