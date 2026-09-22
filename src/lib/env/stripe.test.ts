import { afterEach, describe, expect, it, vi } from "vitest";
import { stripeSecretKey } from "./index";

afterEach(() => vi.unstubAllEnvs());

describe("stripeSecretKey", () => {
  it("is null when Stripe is not configured", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(stripeSecretKey()).toBeNull();
  });

  it("accepts a test-mode key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", " sk_test_abc ");
    expect(stripeSecretKey()).toBe("sk_test_abc");
  });

  it("refuses a live key so test checkout can never take real money", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc");
    expect(() => stripeSecretKey()).toThrow(/test-mode/);
  });
});
