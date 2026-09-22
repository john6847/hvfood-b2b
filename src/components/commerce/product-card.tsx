"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatMinorUsd } from "@/lib/utils";
import type { PriceAccess } from "@/modules/catalog/access";
import {
  casePriceForQuantity,
  hasPricing,
  type CatalogProduct,
  type PublicCatalogProduct,
} from "@/modules/catalog/fixtures";
import { QuantityInput } from "./quantity-input";
import { cn } from "@/lib/utils";

/**
 * Catalog card in the preview's layout: image, brand, name, SKU, case pack,
 * price per case (live for the chosen quantity), first volume break,
 * availability, quantity and the primary action. Without pricing (visitors
 * and unapproved companies) the price and quantity give way to a sign-in
 * prompt; the record it receives has no price fields at all.
 */
export function ProductCard({
  product: p,
  view,
  access,
}: {
  product: CatalogProduct | PublicCatalogProduct;
  view: "grid" | "list";
  access: PriceAccess;
}) {
  const [quantity, setQuantity] = useState(1);
  const priced = hasPricing(p);
  const unit = priced ? casePriceForQuantity(p, quantity) : null;
  const firstBreak = priced ? p.volumeBreaks[0] : undefined;
  const href = `/wholesale/products/${p.slug}`;
  const list = view === "list";

  return (
    <article
      className={cn(
        "flex overflow-hidden rounded-lg border border-border bg-surface",
        list ? "flex-col sm:flex-row sm:items-stretch" : "flex-col",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 bg-surface-muted",
          list ? "aspect-[4/3] w-full sm:aspect-auto sm:min-h-36 sm:w-44 md:w-48" : "aspect-[4/3] w-full",
        )}
      >
        <Link href={href} aria-label={`View ${p.name}`} className="relative block h-full w-full min-h-[140px]">
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes={list ? "(min-width: 640px) 192px, 100vw" : "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"}
            className={cn("object-contain", list ? "p-4 sm:p-3" : "p-6")}
          />
        </Link>
        {p.tag ? (
          <span className="absolute left-3 top-3 rounded-sm bg-surface px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-foreground shadow-sm">
            {p.tag}
          </span>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col gap-1 p-4", list && "sm:flex-row sm:items-center sm:gap-6")}>
        <div className="flex-1">
          <p className="eyebrow">{p.brand}</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            <Link href={href} className="hover:underline hover:underline-offset-4">
              {p.name}
            </Link>
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">{p.sku}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
            <Package className="size-3.5" aria-hidden />
            {p.pack} / case
          </p>
        </div>

        <div className={cn("mt-3 border-t border-border pt-3", list && "sm:mt-0 sm:w-52 md:w-56 sm:border-t-0 sm:pt-0")}>
          {unit !== null ? (
            <p className="flex items-baseline gap-1">
              <strong className="tabular text-lg font-semibold text-foreground">{formatMinorUsd(unit)}</strong>
              <span className="text-xs text-foreground-muted">/ case</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Lock className="size-3.5 text-foreground-muted" aria-hidden />
              {access === "signed-out" ? "Sign in to see price" : "Price after approval"}
            </p>
          )}
          {firstBreak ? (
            <p className="mt-1 text-xs text-foreground-muted">
              {firstBreak.minimumCases}+ cases{" "}
              <strong className="tabular text-foreground">{formatMinorUsd(firstBreak.unitPriceMinor)}</strong> / case
            </p>
          ) : null}
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-xs",
              p.available ? "text-success-fg" : "text-danger-fg",
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {p.available ? "In stock · Ready to order" : "Temporarily unavailable"}
          </p>
        </div>

        <div className={cn("mt-3 flex items-center justify-between gap-2", list && "sm:mt-0 sm:flex-col sm:items-end")}>
          {priced ? <QuantityInput value={quantity} onChange={setQuantity} label={`Cases of ${p.name}`} /> : null}
          <ButtonLink href={priced ? `${href}?cases=${quantity}` : href} size="sm" className={cn(!priced && "ml-auto")}>
            View details
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
