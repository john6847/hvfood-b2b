"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Browser client. Only ever holds the anon key; RLS does the protecting. */
export function createBrowserSupabase() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
