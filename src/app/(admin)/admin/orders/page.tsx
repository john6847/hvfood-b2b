import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  await guardPermission("orders.read");

  return (
    <>
      <PageHeading eyebrow="Operations" title="Orders" />
      <EmptyState
        icon={<ShoppingBag aria-hidden />}
        title="Nothing here yet"
        description="Order list, filters, status changes and fulfillment holds arrive with the purchasing release (Phase 5)."
      />
    </>
  );
}
