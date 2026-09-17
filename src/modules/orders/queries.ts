import "server-only";
import { STATIC_PREVIEW } from "@/lib/env";
import {
  DEMO_ORDERS,
  demoOrderTotals,
  demoOrdersForCompany,
  findDemoOrder,
  type DemoOrder,
} from "@/modules/demo/fixtures";

/**
 * Order reads. Real orders arrive with the purchasing release (Phase 5);
 * until then the connected path returns nothing and the static preview
 * returns sample orders derived from the catalog fixtures.
 */

export type OrderSummary = {
  orderNumber: string;
  companyId: string;
  companyName: string;
  placedBy: string;
  placedAt: string;
  status: DemoOrder["status"];
  paymentStatus: DemoOrder["paymentStatus"];
  fulfillmentStatus: DemoOrder["fulfillmentStatus"];
  poNumber: string | null;
  caseCount: number;
  totalMinor: number;
};

export type OrderDetail = OrderSummary & {
  lines: ReturnType<typeof demoOrderTotals>["lines"];
};

function toSummary(order: DemoOrder): OrderSummary {
  const { subtotalMinor, caseCount } = demoOrderTotals(order);
  return {
    orderNumber: order.orderNumber,
    companyId: order.companyId,
    companyName: order.companyName,
    placedBy: order.placedBy,
    placedAt: order.placedAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    poNumber: order.poNumber,
    caseCount,
    totalMinor: subtotalMinor,
  };
}

/** Every order, for staff. */
export async function listAllOrders(): Promise<OrderSummary[]> {
  if (!STATIC_PREVIEW) return [];
  return DEMO_ORDERS.map(toSummary);
}

/** Orders belonging to one company, for the buyer portal. */
export async function listCompanyOrders(companyId: string): Promise<OrderSummary[]> {
  if (!STATIC_PREVIEW) return [];
  return demoOrdersForCompany(companyId).map(toSummary);
}

export async function getOrder(orderNumber: string): Promise<OrderDetail | null> {
  if (!STATIC_PREVIEW) return null;
  const order = findDemoOrder(orderNumber);
  if (!order) return null;
  const { lines } = demoOrderTotals(order);
  return { ...toSummary(order), lines };
}

const statusLabels: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  ON_HOLD: "On hold",
  PAID: "Paid",
  UNPAID: "Unpaid",
  UNFULFILLED: "Unfulfilled",
  PARTIALLY_FULFILLED: "Partly fulfilled",
  FULFILLED: "Fulfilled",
};

export function orderLabel(value: string): string {
  return statusLabels[value] ?? value;
}

export function paymentLabel(value: string): string {
  return value === "PROCESSING" ? "ACH processing" : orderLabel(value);
}

export function statusTone(value: string): "success" | "warning" | "info" | "neutral" | "danger" {
  switch (value) {
    case "DELIVERED":
    case "PAID":
    case "FULFILLED":
      return "success";
    case "ON_HOLD":
    case "PROCESSING":
      return "warning";
    case "SHIPPED":
    case "READY_TO_SHIP":
      return "info";
    case "UNPAID":
      return "danger";
    default:
      return "neutral";
  }
}
