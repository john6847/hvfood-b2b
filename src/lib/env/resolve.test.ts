import { describe, expect, it } from "vitest";
import { cleanValue, resolveAppUrl, resolveSupabaseMode } from "./resolve";

describe("cleanValue", () => {
  it("treats blank and placeholder values as absent", () => {
    expect(cleanValue(undefined)).toBeUndefined();
    expect(cleanValue("")).toBeUndefined();
    expect(cleanValue("   ")).toBeUndefined();
    expect(cleanValue("undefined")).toBeUndefined();
    expect(cleanValue(" https://x.test ")).toBe("https://x.test");
  });
});

describe("resolveAppUrl", () => {
  it("falls back instead of throwing on a bad value", () => {
    expect(resolveAppUrl({ appUrl: "" })).toBe("http://localhost:3000");
    expect(resolveAppUrl({ appUrl: "not a url" })).toBe("http://localhost:3000");
    expect(resolveAppUrl({ appUrl: "   " })).toBe("http://localhost:3000");
    expect(resolveAppUrl({ appUrl: "javascript:alert(1)" })).toBe("http://localhost:3000");
  });

  it("accepts a bare host by assuming https", () => {
    expect(resolveAppUrl({ appUrl: "hvfood-b2b.vercel.app" })).toBe("https://hvfood-b2b.vercel.app");
  });

  it("keeps a valid origin and drops any path", () => {
    expect(resolveAppUrl({ appUrl: "https://example.test/wholesale" })).toBe("https://example.test");
    expect(resolveAppUrl({ appUrl: "http://localhost:3000" })).toBe("http://localhost:3000");
  });

  it("uses the platform host when nothing is configured", () => {
    expect(resolveAppUrl({ appUrl: "", vercelUrl: "my-app.vercel.app" })).toBe(
      "https://my-app.vercel.app",
    );
  });
});

describe("resolveSupabaseMode", () => {
  it("is static when neither variable is set", () => {
    expect(resolveSupabaseMode({}).kind).toBe("static");
    expect(resolveSupabaseMode({ url: "", anonKey: "  " }).kind).toBe("static");
  });

  it("is connected when both are set", () => {
    const mode = resolveSupabaseMode({ url: "https://p.supabase.co", anonKey: "key" });
    expect(mode).toEqual({ kind: "connected", url: "https://p.supabase.co", anonKey: "key" });
  });

  it("reports a half-configured project instead of faking data", () => {
    const mode = resolveSupabaseMode({ url: "https://p.supabase.co" });
    expect(mode.kind).toBe("incomplete");
    if (mode.kind === "incomplete") {
      expect(mode.missing).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
  });

  it("rejects a URL without a scheme", () => {
    const mode = resolveSupabaseMode({ url: "p.supabase.co", anonKey: "key" });
    expect(mode.kind).toBe("incomplete");
  });
});
