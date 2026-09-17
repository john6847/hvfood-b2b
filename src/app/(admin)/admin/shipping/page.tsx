import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingPage() {
  await guardPermission("settings.manage");

  return (
    <>
      <PageHeading eyebrow="Operations" title="Shipping" />
      <EmptyState
        icon={<Truck aria-hidden />}
        title="Nothing here yet"
        description="Shipping rules, packaging defaults and ShipStation arrive with the shipping release (Phase 6)."
      />
    </>
  );
}
