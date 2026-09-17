import type { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  await guardPermission("pricing.read");

  return (
    <>
      <PageHeading eyebrow="Operations" title="Pricing" />
      <EmptyState
        icon={<DollarSign aria-hidden />}
        title="Nothing here yet"
        description="Price lists, tiers, quantity breaks and company overrides arrive with the pricing release (Phase 4)."
      />
    </>
  );
}
