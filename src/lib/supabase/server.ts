import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Session-scoped client for Server Components, Server Actions and Route
 * Handlers. Requests run as the signed-in user, so RLS stays in force.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  const { url, anonKey } = supabaseEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // The proxy refreshes sessions, so this is safe to ignore.
          }
        },
      },
    },
  );
}

export type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;
