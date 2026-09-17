"use client";

import { useState } from "react";
import { Notice } from "@/components/ui/notice";
import { formatMinorUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { casePriceForQuantity, type CatalogProduct } from "@/modules/catalog/fixtures";
import { QuantityInput } from "./quantity-input";

/**
 * Quantity math the blueprint asks for: "10 cases × 12 units = 120 units"
 * with the applicable case price and extended total. Cart submission
 * arrives with the purchasing release.
 */
export function ProductOrderPanel({ product, initialCases }: { product: CatalogProduct; initialCases: number }) {
  const [cases, setCases] = useState(initialCases);
  const unit = casePriceForQuantity(product, cases);
  const total = unit * cases;
  const units = cases * product.unitsPerCase;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs",
          product.available ? "text-success-fg" : "text-danger-fg",
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {product.available ? "In stock · Available by the case" : "Temporarily unavailable"}
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <QuantityInput value={cases} onChange={setCases} label={`Cases of ${product.name}`} />
          <p className="mt-2 text-xs text-foreground-muted">
            {cases} {cases === 1 ? "case" : "cases"} × {product.unitsPerCase} units = {units} units
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-xl font-semibold text-foreground">{formatMinorUsd(total)}</p>
          <p className="text-xs text-foreground-muted">
            {cases} × {formatMinorUsd(unit)} / case
          </p>
        </div>
      </div>

      <Notice tone="info" className="mt-5">
        Add to cart and checkout open with the purchasing release. Your prices and case packs are
        shown here so you can plan orders in the meantime.
      </Notice>
    </div>
  );
}
