import { z } from "zod";

/**
 * Environment access is centralized so a missing or malformed variable fails
 * at startup with a clear message instead of deep inside a request.
 *
 * `publicEnv` is safe for the browser. `serverEnv()` must only be called from
 * server code; the service role key bypasses RLS and is never exposed.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

function parse<T extends z.ZodType>(schema: T, input: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid ${label} environment: ${issues}`);
  }
  return result.data;
}

// Next.js inlines NEXT_PUBLIC_* only when referenced explicitly by name.
export const publicEnv = parse(
  publicSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  "public",
);

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser");
  }
  if (!cachedServerEnv) {
    cachedServerEnv = parse(
      serverSchema,
      { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY },
      "server",
    );
  }
  return cachedServerEnv;
}
