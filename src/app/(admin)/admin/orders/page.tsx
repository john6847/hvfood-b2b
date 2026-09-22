import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { OrderTable } from "@/components/commerce/order-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { guardPermission } from "@/modules/identity/guards";
import { listAllOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Orders" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "action", label: "Needs action" },
  { value: "hold", label: "On hold" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await guardPermission("orders.read");
  const params = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.value === params.filter)
    ? (params.filter as Filter)
    : "all";

  const all = await listAllOrders();
  const orders = all.filter((o) => {
    switch (filter) {
      case "action":
        return o.status === "ON_HOLD" || o.fulfillmentStatus === "UNFULFILLED";
      case "hold":
        return o.status === "ON_HOLD";
      case "shipped":
        return o.status === "SHIPPED";
      case "delivered":
        return o.status === "DELIVERED";
      default:
        return true;
    }
  });

  return (
    <>
      <PageHeading
        eyebrow="Operations"
        title="Orders"
        description="Every wholesale order, with payment and fulfillment state."
      />

      <Panel>
        <nav
          aria-label="Order filter"
          className="flex flex-wrap gap-1 border-b border-border px-4 py-3"
        >
          {FILTERS.map((f) => {
            const href = f.value === "all" ? "/admin/orders" : `/admin/orders?filter=${f.value}`;
            const current = filter === f.value;
            return (
              <Link
                key={f.value}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium sm:px-3 sm:py-1.5",
                  current ? "bg-accent text-primary font-semibold" : "text-foreground-muted hover:bg-muted",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ShoppingBag aria-hidden />}
              title={all.length === 0 ? "No orders yet" : "No orders match"}
              description={
                all.length === 0
                  ? "Orders appear here once the purchasing release is live."
                  : "Try another filter."
              }
            />
          </div>
        ) : (
          <OrderTable orders={orders} basePath="/admin/orders" showCustomer />
        )}
      </Panel>
    </>
  );
}
