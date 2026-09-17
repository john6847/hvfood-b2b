import { describe, expect, it } from "vitest";
import {
  accessStateFor,
  canManageCompany,
  canPurchase,
  canSeePrices,
  resolveActiveMembership,
  type Membership,
} from "./company-access";

const approvedOwner: Membership = {
  membershipId: "m1",
  companyId: "c-approved",
  companyDisplayName: "Approved Co",
  companyStatus: "APPROVED",
  role: "OWNER",
};

const pendingOwner: Membership = {
  membershipId: "m2",
  companyId: "c-pending",
  companyDisplayName: "Pending Co",
  companyStatus: "PENDING",
  role: "OWNER",
};

const suspendedBuyer: Membership = {
  membershipId: "m3",
  companyId: "c-suspended",
  companyDisplayName: "Suspended Co",
  companyStatus: "SUSPENDED",
  role: "BUYER",
};

const approvedViewer: Membership = {
  membershipId: "m4",
  companyId: "c-approved-2",
  companyDisplayName: "Approved Two",
  companyStatus: "APPROVED",
  role: "VIEWER",
};

describe("accessStateFor", () => {
  it("maps every company status", () => {
    expect(accessStateFor("APPROVED")).toBe("approved");
    expect(accessStateFor("PENDING")).toBe("pending");
    expect(accessStateFor("SUSPENDED")).toBe("suspended");
    expect(accessStateFor("REJECTED")).toBe("rejected");
    expect(accessStateFor(null)).toBe("none");
  });
});

describe("resolveActiveMembership", () => {
  it("returns null with no memberships", () => {
    expect(resolveActiveMembership([], "c-approved")).toBeNull();
  });

  it("honors a preferred company only when it is one of the person's memberships", () => {
    expect(resolveActiveMembership([approvedOwner, pendingOwner], "c-pending")).toBe(pendingOwner);
    expect(resolveActiveMembership([approvedOwner, pendingOwner], "c-someone-else")).toBe(approvedOwner);
  });

  it("prefers an approved company when nothing is selected", () => {
    expect(resolveActiveMembership([pendingOwner, approvedOwner], null)).toBe(approvedOwner);
  });

  it("falls back to the first membership when none is approved", () => {
    expect(resolveActiveMembership([pendingOwner, suspendedBuyer], undefined)).toBe(pendingOwner);
  });
});

describe("capabilities", () => {
  it("lets owners and buyers of approved companies purchase", () => {
    expect(canPurchase(approvedOwner)).toBe(true);
    expect(canPurchase(approvedViewer)).toBe(false);
    expect(canPurchase(pendingOwner)).toBe(false);
    expect(canPurchase(suspendedBuyer)).toBe(false);
    expect(canPurchase(null)).toBe(false);
  });

  it("shows prices to approved members only, including viewers", () => {
    expect(canSeePrices(approvedViewer)).toBe(true);
    expect(canSeePrices(pendingOwner)).toBe(false);
    expect(canSeePrices(suspendedBuyer)).toBe(false);
    expect(canSeePrices(null)).toBe(false);
  });

  it("lets only owners manage the company, regardless of status", () => {
    expect(canManageCompany(approvedOwner)).toBe(true);
    expect(canManageCompany(pendingOwner)).toBe(true);
    expect(canManageCompany(suspendedBuyer)).toBe(false);
    expect(canManageCompany(approvedViewer)).toBe(false);
  });
});
