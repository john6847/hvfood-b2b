import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { canPurchase } from "@/modules/identity/company-access";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Quick order" };

export default async function QuickOrderPage() {
  const membership = await getActiveMembership();
  if (!canPurchase(membership)) redirect("/wholesale/dashboard");

  return (
    <>
      <PageHeading
        eyebrow="Fast reorder"
        title="Quick order by SKU"
        description="Type a SKU and a case quantity per line. Rows are validated before anything is added to your cart."
      />
      <EmptyState
        icon={<Zap aria-hidden />}
        title="Quick order opens with the catalog"
        description="SKU lookup needs the product catalog, which is published in the next release."
      />
    </>
  );
}
