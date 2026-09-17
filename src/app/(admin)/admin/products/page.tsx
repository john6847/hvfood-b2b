import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await guardPermission("catalog.read");

  return (
    <>
      <PageHeading eyebrow="Operations" title="Products" />
      <EmptyState
        icon={<Boxes aria-hidden />}
        title="Nothing here yet"
        description="Product, packaging and category management arrive with the catalog release (Phase 3)."
      />
    </>
  );
}
