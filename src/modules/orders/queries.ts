import "server-only";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import {
  DEMO_ORDERS,
  demoOrderTotals,
  demoOrdersForCompany,
  findDemoOrder,
  type DemoOrder,
} from "@/modules/demo/fixtures";

export type PaymentMethod = "CARD" | "ACH" | "WIRE";

export type OrderSummary = {
  id?: string;
  orderNumber: string;
  companyId: string;
  companyName: string;
  placedBy: string;
  placedAt: string;
  status: DemoOrder["status"] | "CANCELLED";
  paymentStatus: DemoOrder["paymentStatus"];
  paymentMethod?: PaymentMethod;
  fulfillmentStatus: DemoOrder["fulfillmentStatus"];
  poNumber: string | null;
  wireReference?: string | null;
  caseCount: number;
  totalMinor: number;
};

export type OrderDetail = OrderSummary & {
  lines: ReturnType<typeof demoOrderTotals>["lines"];
  internalNotes?: string | null;
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
    paymentMethod: "CARD",
    fulfillmentStatus: order.fulfillmentStatus,
    poNumber: order.poNumber,
    caseCount,
    totalMinor: subtotalMinor,
  };
}

/** Every order, for staff. */
export async function listAllOrders(): Promise<OrderSummary[]> {
  if (STATIC_PREVIEW) return DEMO_ORDERS.map(toSummary);

  try {
    const supabase = await createSessionClient();
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        company_id,
        placed_by_name,
        created_at,
        status,
        payment_status,
        payment_method,
        fulfillment_status,
        po_number,
        wire_reference,
        total_minor,
        companies (
          display_name
        ),
        order_lines (
          cases
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !dbOrders || dbOrders.length === 0) {
      return DEMO_ORDERS.map(toSummary);
    }

    return dbOrders.map((o) => {
      const lines = o.order_lines ?? [];
      const caseCount = lines.reduce((acc: number, l: { cases: number }) => acc + (l.cases ?? 0), 0);
      return {
        id: o.id,
        orderNumber: o.order_number,
        companyId: o.company_id,
        companyName: (o.companies as unknown as { display_name: string } | null)?.display_name ?? "Company",
        placedBy: o.placed_by_name,
        placedAt: o.created_at,
        status: o.status as DemoOrder["status"],
        paymentStatus: o.payment_status as DemoOrder["paymentStatus"],
        paymentMethod: (o.payment_method as PaymentMethod) || "CARD",
        fulfillmentStatus: o.fulfillment_status as DemoOrder["fulfillmentStatus"],
        poNumber: o.po_number,
        wireReference: o.wire_reference,
        caseCount,
        totalMinor: Number(o.total_minor),
      };
    });
  } catch {
    return DEMO_ORDERS.map(toSummary);
  }
}

/** Orders belonging to one company, for the buyer portal. */
export async function listCompanyOrders(companyId: string): Promise<OrderSummary[]> {
  if (STATIC_PREVIEW) return demoOrdersForCompany(companyId).map(toSummary);

  try {
    const supabase = await createSessionClient();
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        company_id,
        placed_by_name,
        created_at,
        status,
        payment_status,
        payment_method,
        fulfillment_status,
        po_number,
        wire_reference,
        total_minor,
        companies (
          display_name
        ),
        order_lines (
          cases
        )
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error || !dbOrders || dbOrders.length === 0) {
      return demoOrdersForCompany(companyId).map(toSummary);
    }

    return dbOrders.map((o) => {
      const lines = o.order_lines ?? [];
      const caseCount = lines.reduce((acc: number, l: { cases: number }) => acc + (l.cases ?? 0), 0);
      return {
        id: o.id,
        orderNumber: o.order_number,
        companyId: o.company_id,
        companyName: (o.companies as unknown as { display_name: string } | null)?.display_name ?? "Company",
        placedBy: o.placed_by_name,
        placedAt: o.created_at,
        status: o.status as DemoOrder["status"],
        paymentStatus: o.payment_status as DemoOrder["paymentStatus"],
        paymentMethod: (o.payment_method as PaymentMethod) || "CARD",
        fulfillmentStatus: o.fulfillment_status as DemoOrder["fulfillmentStatus"],
        poNumber: o.po_number,
        wireReference: o.wire_reference,
        caseCount,
        totalMinor: Number(o.total_minor),
      };
    });
  } catch {
    return demoOrdersForCompany(companyId).map(toSummary);
  }
}

export async function getOrder(orderNumber: string): Promise<OrderDetail | null> {
  if (STATIC_PREVIEW) {
    const order = findDemoOrder(orderNumber);
    if (!order) return null;
    const { lines } = demoOrderTotals(order);
    return { ...toSummary(order), lines };
  }

  try {
    const supabase = await createSessionClient();
    const { data: o, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        company_id,
        placed_by_name,
        created_at,
        status,
        payment_status,
        payment_method,
        fulfillment_status,
        po_number,
        wire_reference,
        total_minor,
        internal_notes,
        companies (
          display_name
        ),
        order_lines (
          product_slug,
          product_name,
          product_sku,
          pack_description,
          image_url,
          cases,
          unit_price_minor,
          total_minor
        )
      `)
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !o) {
      const order = findDemoOrder(orderNumber);
      if (!order) return null;
      const { lines } = demoOrderTotals(order);
      return { ...toSummary(order), lines };
    }

    const lines = (o.order_lines ?? []).map((l) => ({
      productSlug: l.product_slug,
      name: l.product_name,
      sku: l.product_sku,
      pack: l.pack_description,
      image: l.image_url ?? "",
      cases: l.cases,
      unitPriceMinor: Number(l.unit_price_minor),
      totalMinor: Number(l.total_minor),
    }));
    const caseCount = lines.reduce((acc, l) => acc + l.cases, 0);

    return {
      id: o.id,
      orderNumber: o.order_number,
      companyId: o.company_id,
      companyName: (o.companies as unknown as { display_name: string } | null)?.display_name ?? "Company",
      placedBy: o.placed_by_name,
      placedAt: o.created_at,
      status: o.status as DemoOrder["status"],
      paymentStatus: o.payment_status as DemoOrder["paymentStatus"],
      paymentMethod: (o.payment_method as PaymentMethod) || "CARD",
      fulfillmentStatus: o.fulfillment_status as DemoOrder["fulfillmentStatus"],
      poNumber: o.po_number,
      wireReference: o.wire_reference,
      caseCount,
      totalMinor: Number(o.total_minor),
      internalNotes: o.internal_notes,
      lines,
    };
  } catch {
    const order = findDemoOrder(orderNumber);
    if (!order) return null;
    const { lines } = demoOrderTotals(order);
    return { ...toSummary(order), lines };
  }
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
  CANCELLED: "Cancelled",
};

export function orderLabel(value: string): string {
  return statusLabels[value] ?? value;
}

export function paymentMethodLabel(method?: string): string {
  switch (method) {
    case "CARD":
      return "Credit / Debit Card";
    case "ACH":
      return "ACH Direct Debit";
    case "WIRE":
      return "Wire Transfer";
    default:
      return method ?? "Card";
  }
}

export function paymentLabel(value: string, method?: string): string {
  if (value === "PROCESSING") return "ACH processing";
  if (value === "UNPAID" && method === "WIRE") return "Awaiting Wire";
  return statusLabels[value] ?? value;
}

export function statusTone(
  value: string,
  method?: string
): "success" | "warning" | "info" | "neutral" | "danger" {
  if (value === "UNPAID" && method === "WIRE") return "warning";

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
