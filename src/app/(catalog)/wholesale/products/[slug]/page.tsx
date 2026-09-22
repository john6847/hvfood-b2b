import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PricingNotice } from "@/components/commerce/pricing-notice";
import { ProductOrderPanel } from "@/components/commerce/product-order-panel";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { formatMinorUsd } from "@/lib/utils";
import { getPriceAccess } from "@/modules/catalog/access";
import { getActiveMembership } from "@/modules/identity/service";
import { getDbProductBySlug, getDbCatalog } from "@/modules/catalog/catalog-service";
import { hasPricing } from "@/modules/catalog/fixtures";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getDbProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

/**
 * Product detail. Anyone may view the product; the volume price table,
 * case math and related prices render only for approved members. This is a
 * server component, so hidden prices are never serialized to the browser.
 */
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cases?: string }>;
}) {
  const [access, membership] = await Promise.all([
    getPriceAccess(),
    getActiveMembership(),
  ]);
  const companyId = membership?.companyStatus === "APPROVED" ? membership.companyId : null;

  const { slug } = await params;
  const product = await getDbProductBySlug(slug, companyId);
  if (!product) notFound();

  const { cases } = await searchParams;
  const initialCases = Math.min(999, Math.max(1, Number.parseInt(cases ?? "1", 10) || 1));

  const allItems = await getDbCatalog(companyId);
  const related = allItems.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 3);

  return (
    <>
      <Link
        href="/wholesale/catalog"
        className="mb-6 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-contain p-6 sm:p-10"
          />
          {product.tag ? (
            <span className="absolute left-4 top-4 rounded-sm bg-surface px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-foreground shadow-sm">
              {product.tag}
            </span>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="eyebrow">{product.brand}</span>
            <span className="text-foreground-subtle">·</span>
            <span className="eyebrow">{product.category}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground sm:text-3xl">{product.name}</h1>
          <p className="font-mono text-xs text-foreground-muted">SKU: {product.sku}</p>

          <p className="mt-4 text-sm text-foreground-muted sm:text-base">{product.description}</p>

          <div className="mt-6">
            <DefinitionList
              items={[
                { term: "Packaging", value: product.pack },
                { term: "Units per case", value: `${product.unitsPerCase} retail units` },
                {
                  term: "Availability",
                  value: (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <span
                        className={`size-2 rounded-full ${product.available ? "bg-success-fg" : "bg-warning-fg"}`}
                        aria-hidden
                      />
                      {product.available ? "In stock · Ships within 1–2 business days" : "Availability varies"}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {access === "approved" && hasPricing(product) ? (
            <>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Price per case by quantity</caption>
                  <thead>
                    <tr className="text-left">
                      <th className="eyebrow py-2 font-semibold">Order quantity</th>
                      <th className="eyebrow py-2 text-right font-semibold">Price per case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="py-2 text-foreground">
                        {product.volumeBreaks[0] ? `1–${product.volumeBreaks[0].minimumCases - 1} cases` : "Any quantity"}
                      </td>
                      <td className="tabular py-2 text-right font-medium text-foreground">{formatMinorUsd(product.casePriceMinor)}</td>
                    </tr>
                    {product.volumeBreaks.map((tier, index) => {
                      const next = product.volumeBreaks[index + 1];
                      return (
                        <tr key={tier.minimumCases} className="border-t border-border">
                          <td className="py-2 text-foreground">
                            {next ? `${tier.minimumCases}–${next.minimumCases - 1} cases` : `${tier.minimumCases}+ cases`}
                          </td>
                          <td className="tabular py-2 text-right font-medium text-foreground">{formatMinorUsd(tier.unitPriceMinor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <ProductOrderPanel product={product} initialCases={initialCases} />
              </div>
            </>
          ) : access !== "approved" ? (
            <PricingNotice access={access} next={`/wholesale/products/${product.slug}`} className="mt-6" />
          ) : null}
        </div>
      </div>

      {related.length ? (
        <Panel className="mt-10 sm:mt-12">
          <PanelHeader title={`More in ${product.category}`} />
          <PanelBody className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/wholesale/products/${p.slug}`} className="group flex items-center gap-3 rounded-md p-1.5 hover:bg-surface-muted transition-colors">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:size-16">
                  <Image src={p.image} alt="" fill sizes="64px" className="object-contain p-2" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                    {p.name}
                  </span>
                  <span className="tabular block text-xs text-foreground-muted">
                    {access === "approved" && hasPricing(p) ? `${formatMinorUsd(p.casePriceMinor)} / case` : p.pack}
                  </span>
                </span>
              </Link>
            ))}
          </PanelBody>
        </Panel>
      ) : null}
    </>
  );
}
