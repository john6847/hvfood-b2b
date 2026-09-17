import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  await guardPermission("integrations.manage");

  return (
    <>
      <PageHeading eyebrow="Operations" title="Integrations" />
      <EmptyState
        icon={<Plug aria-hidden />}
        title="Nothing here yet"
        description="Shopify sync, Stripe and ShipStation accounts are configured in their implementation phases."
      />
    </>
  );
}
