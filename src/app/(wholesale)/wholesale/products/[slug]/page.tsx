import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductOrderPanel } from "@/components/commerce/product-order-panel";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { formatMinorUsd } from "@/lib/utils";
import { catalogProducts, findProductBySlug } from "@/modules/catalog/fixtures";
import { getActiveMembership } from "@/modules/identity/service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

/** Product detail with case math and the volume price table. Approved members only. */
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cases?: string }>;
}) {
  const membership = await getActiveMembership();
  if (membership?.companyStatus !== "APPROVED") redirect("/wholesale/dashboard");

  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) notFound();

  const { cases } = await searchParams;
  const initialCases = Math.min(999, Math.max(1, Number.parseInt(cases ?? "1", 10) || 1));

  const related = catalogProducts.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 3);

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
            className="object-contain p-10"
          />
          {product.tag ? (
            <span className="absolute left-4 top-4 rounded-sm bg-surface px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-foreground shadow-sm">
              {product.tag}
            </span>
          ) : null}
        </div>

        <div>
          <p className="eyebrow">{product.brand}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{product.name}</h1>
          <p className="mt-3 max-w-prose text-base text-foreground-muted">{product.description}</p>
          <p className="mt-3 text-xs text-foreground-muted">
            {product.sku} · {product.category}
          </p>

          <div className="mt-6">
            <DefinitionList
              items={[
                { term: "Case pack", value: product.pack },
                { term: "Units per case", value: String(product.unitsPerCase) },
                { term: "Minimum order", value: "1 case" },
                { term: "Order increment", value: "1 case" },
              ]}
            />
          </div>

          <table className="mt-6 w-full text-sm">
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

          <div className="mt-6">
            <ProductOrderPanel product={product} initialCases={initialCases} />
          </div>
        </div>
      </div>

      {related.length ? (
        <Panel className="mt-12">
          <PanelHeader title={`More in ${product.category}`} />
          <PanelBody className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/wholesale/products/${p.slug}`} className="group flex items-center gap-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                  <Image src={p.image} alt="" fill sizes="64px" className="object-contain p-2" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                    {p.name}
                  </span>
                  <span className="tabular block text-xs text-foreground-muted">{formatMinorUsd(p.casePriceMinor)} / case</span>
                </span>
              </Link>
            ))}
          </PanelBody>
        </Panel>
      ) : null}
    </>
  );
}
