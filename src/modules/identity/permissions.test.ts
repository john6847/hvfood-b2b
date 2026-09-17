import { describe, expect, it } from "vitest";
import {
  ADMIN_NAVIGATION,
  hasAnyPermission,
  hasPermission,
  isPermission,
  visibleAdminNavigation,
} from "./permissions";

describe("permissions", () => {
  it("recognizes known permission codes", () => {
    expect(isPermission("accounts.read")).toBe(true);
    expect(isPermission("superuser")).toBe(false);
  });

  it("checks a single permission", () => {
    expect(hasPermission(["orders.read"], "orders.read")).toBe(true);
    expect(hasPermission(["orders.read"], "orders.manage")).toBe(false);
    expect(hasPermission([], "orders.read")).toBe(false);
  });

  it("checks any-of alternatives", () => {
    expect(hasAnyPermission(["fulfillment.manage"], ["settings.manage", "fulfillment.manage"])).toBe(true);
    expect(hasAnyPermission(["catalog.read"], ["settings.manage", "fulfillment.manage"])).toBe(false);
  });

  it("always shows Home and hides sections the role cannot use", () => {
    const readOnly = ["accounts.read", "catalog.read", "pricing.read", "orders.read"];
    const labels = visibleAdminNavigation(readOnly).map((item) => item.label);
    expect(labels).toEqual(["Home", "Orders", "Products", "Customers", "Pricing"]);
  });

  it("shows everything to an administrator", () => {
    const all = ADMIN_NAVIGATION.flatMap((item) => item.anyOf);
    expect(visibleAdminNavigation(all)).toHaveLength(ADMIN_NAVIGATION.length);
  });

  it("shows only Home to a staff member with no permissions", () => {
    expect(visibleAdminNavigation([]).map((item) => item.label)).toEqual(["Home"]);
  });
});
