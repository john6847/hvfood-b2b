import { describe, expect, it } from "vitest";
import {
  wholesaleApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
} from "./schemas";
import { generateInvitationToken, hashToken } from "./crypto";

describe("wholesaleApplicationSchema", () => {
  const validData = {
    firstName: "Jean",
    lastName: "Martin",
    businessName: "Jean's Gourmet Market LLC",
    email: "orders@jeansmarket.com",
    phone: "305-555-0142",
    website: "https://jeansmarket.com",
    businessType: "RETAIL" as const,
    street1: "450 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    postalCode: "33132",
    estimatedMonthlyVolume: "25 – 100 cases / month",
    productsInterestedIn: ["Specialty Sauces & Condiments"],
  };

  it("validates a complete application", () => {
    const res = wholesaleApplicationSchema.safeParse(validData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("orders@jeansmarket.com");
      expect(res.data.state).toBe("FL");
    }
  });

  it("auto-prefixes https:// to websites without a scheme", () => {
    const res = wholesaleApplicationSchema.safeParse({
      ...validData,
      website: "jeansmarket.com",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.website).toBe("https://jeansmarket.com");
    }
  });

  it("rejects invalid US ZIP codes", () => {
    const res = wholesaleApplicationSchema.safeParse({
      ...validData,
      postalCode: "1234",
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid state codes", () => {
    const res = wholesaleApplicationSchema.safeParse({
      ...validData,
      state: "ZZ",
    });
    expect(res.success).toBe(false);
  });

  it("rejects missing business name", () => {
    const res = wholesaleApplicationSchema.safeParse({
      ...validData,
      businessName: "  ",
    });
    expect(res.success).toBe(false);
  });
});

describe("invitation crypto", () => {
  it("generates 64-char hex token and sha256 hash", () => {
    const { token, tokenHash } = generateInvitationToken();
    expect(token).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes deterministically", () => {
    const token = "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890";
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
  });

  it("produces distinct hashes for different tokens", () => {
    const t1 = generateInvitationToken();
    const t2 = generateInvitationToken();
    expect(t1.tokenHash).not.toBe(t2.tokenHash);
  });
});

describe("approval and rejection schemas", () => {
  it("validates approval with valid UUIDs", () => {
    const res = approveApplicationSchema.safeParse({
      applicationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      pricingTierId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-uuid in approval", () => {
    const res = approveApplicationSchema.safeParse({
      applicationId: "not-a-uuid",
      pricingTierId: "tier-1",
    });
    expect(res.success).toBe(false);
  });

  it("validates rejection with valid UUID and notes", () => {
    const res = rejectApplicationSchema.safeParse({
      applicationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      internalNotes: "Unverified business entity",
      customerMessage: "Unable to approve at this time.",
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-uuid in rejection", () => {
    const res = rejectApplicationSchema.safeParse({
      applicationId: "invalid-id",
    });
    expect(res.success).toBe(false);
  });
});
