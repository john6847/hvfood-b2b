import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Catalog" };

/** Approved members only. Products and prices arrive with the catalog phase. */
export default async function CatalogPage() {
  const membership = await getActiveMembership();
  if (membership?.companyStatus !== "APPROVED") redirect("/wholesale/dashboard");

  return (
    <>
      <PageHeading
        eyebrow="Good food. Good business."
        title="Wholesale catalog"
        description="Your essentials, by the case."
      />
      <EmptyState
        icon={<Store aria-hidden />}
        title="The catalog is being set up"
        description="Products, case packs, availability and your wholesale prices are published with the catalog and pricing releases. This page is reserved for approved customers only."
      />
    </>
  );
}
