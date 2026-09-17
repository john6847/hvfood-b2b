/**
 * Pure environment resolution. No I/O and no throwing, so a blank or
 * malformed variable can never take down a build at module-load time.
 * Unit tested in `resolve.test.ts`.
 */

/** Trims, and treats blank or placeholder-ish values as absent. */
export function cleanValue(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "undefined" || trimmed === "null") return undefined;
  return trimmed;
}

/**
 * Best-effort app origin. Accepts a bare host ("example.com") by assuming
 * https, falls back to the platform-provided host, then to localhost.
 * Never throws: the value is only used to build redirect links.
 */
export function resolveAppUrl(input: {
  appUrl?: string | null;
  vercelUrl?: string | null;
  fallback?: string;
}): string {
  const fallback = input.fallback ?? "http://localhost:3000";

  for (const candidate of [cleanValue(input.appUrl), cleanValue(input.vercelUrl)]) {
    if (!candidate) continue;
    const normalized = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
    try {
      const url = new URL(normalized);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return fallback;
}

export type SupabaseMode =
  | { kind: "static" }
  | { kind: "connected"; url: string; anonKey: string }
  | { kind: "incomplete"; missing: string[] };

/**
 * Decides how the app runs:
 * - neither variable set: static preview from fixtures
 * - both set: connected to Supabase
 * - exactly one set: a misconfiguration, reported rather than silently
 *   downgraded to fake data
 */
export function resolveSupabaseMode(input: {
  url?: string | null;
  anonKey?: string | null;
}): SupabaseMode {
  const url = cleanValue(input.url);
  const anonKey = cleanValue(input.anonKey);

  if (!url && !anonKey) return { kind: "static" };

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (url && !/^https?:\/\//i.test(url)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL (must start with https://)");
  }

  if (missing.length > 0) return { kind: "incomplete", missing };
  return { kind: "connected", url: url!, anonKey: anonKey! };
}
