import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { verifyDemoCredentials } = await import("./accounts");

describe("static preview test accounts", () => {
  it("signs in the buyer and the admin with their passwords", () => {
    expect(verifyDemoCredentials("paul.maly51@gmail.com", "School123")?.key).toBe("buyer");
    expect(verifyDemoCredentials("admin@horizonvertb2b.com", "School123")?.key).toBe("admin");
  });

  it("ignores email case and surrounding spaces", () => {
    expect(verifyDemoCredentials("  Paul.Maly51@Gmail.com ", "School123")?.key).toBe("buyer");
  });

  it("rejects a wrong password or unknown email", () => {
    expect(verifyDemoCredentials("paul.maly51@gmail.com", "school123")).toBeNull();
    expect(verifyDemoCredentials("someone@example.com", "School123")).toBeNull();
  });
});
