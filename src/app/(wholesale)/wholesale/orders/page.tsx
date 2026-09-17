import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const membership = await getActiveMembership();
  if (!membership || membership.companyStatus === "PENDING" || membership.companyStatus === "REJECTED") {
    redirect("/wholesale/dashboard");
  }

  return (
    <>
      <PageHeading
        eyebrow={membership.companyDisplayName}
        title="Orders"
        description="Every order placed by your company, with payment and shipping status."
      />
      <EmptyState
        icon={<ClipboardList aria-hidden />}
        title="No orders yet"
        description="Order history and reorder arrive with the purchasing release. Orders placed by anyone on your company will be listed here."
      />
    </>
  );
}
