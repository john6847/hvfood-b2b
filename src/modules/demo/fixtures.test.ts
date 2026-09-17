import { describe, expect, it } from "vitest";
import {
  DEMO_APPLICATIONS,
  DEMO_COMPANY_RECORDS,
  DEMO_COMPANY_SUMMARIES,
  DEMO_MEMBERSHIPS,
  DEMO_ORDERS,
  DEMO_ACTIVE_COMPANY_ID,
  demoOrderTotals,
  demoOrdersForCompany,
} from "./fixtures";
import { catalogProducts } from "@/modules/catalog/fixtures";

describe("static preview fixtures", () => {
  it("has a record for every company summary", () => {
    for (const summary of DEMO_COMPANY_SUMMARIES) {
      expect(DEMO_COMPANY_RECORDS[summary.id]?.summary.id).toBe(summary.id);
    }
  });

  it("keeps member counts in step with the member lists", () => {
    for (const summary of DEMO_COMPANY_SUMMARIES) {
      const record = DEMO_COMPANY_RECORDS[summary.id]!;
      expect(record.members.filter((m) => m.active)).toHaveLength(summary.memberCount);
    }
  });

  it("points every delivery location at an address of the same company", () => {
    for (const record of Object.values(DEMO_COMPANY_RECORDS)) {
      const ids = new Set(record.addresses.map((a) => a.id));
      for (const location of record.locations) expect(ids.has(location.addressId)).toBe(true);
    }
  });

  it("references real catalog products in every order line", () => {
    const slugs = new Set(catalogProducts.map((p) => p.slug));
    for (const order of DEMO_ORDERS) {
      for (const line of order.lines) expect(slugs.has(line.productSlug)).toBe(true);
    }
  });

  it("derives order totals from catalog prices", () => {
    const order = DEMO_ORDERS[0]!;
    const { lines, subtotalMinor, caseCount } = demoOrderTotals(order);
    expect(subtotalMinor).toBe(lines.reduce((sum, l) => sum + l.totalMinor, 0));
    expect(caseCount).toBe(order.lines.reduce((sum, l) => sum + l.cases, 0));
    // 12 cases of jasmine rice crosses the 10-case break at $78.96.
    expect(lines[0]?.unitPriceMinor).toBe(7896);
  });

  it("gives every order to a known company", () => {
    const ids = new Set(DEMO_COMPANY_SUMMARIES.map((c) => c.id));
    for (const order of DEMO_ORDERS) expect(ids.has(order.companyId)).toBe(true);
  });

  it("scopes company orders to that company", () => {
    const scoped = demoOrdersForCompany(DEMO_ACTIVE_COMPANY_ID);
    expect(scoped.length).toBeGreaterThan(0);
    for (const order of scoped) expect(order.companyId).toBe(DEMO_ACTIVE_COMPANY_ID);
  });

  it("makes the preview act as an approved company", () => {
    const active = DEMO_MEMBERSHIPS.find((m) => m.companyId === DEMO_ACTIVE_COMPANY_ID);
    expect(active?.companyStatus).toBe("APPROVED");
  });

  it("uses example.com-style domains so no real address is implied", () => {
    for (const app of DEMO_APPLICATIONS) expect(app.email).toMatch(/\.example$/);
    for (const summary of DEMO_COMPANY_SUMMARIES) expect(summary.email).toMatch(/\.example$/);
  });
});
