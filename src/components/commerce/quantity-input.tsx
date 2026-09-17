"use client";

import { Minus, Plus } from "lucide-react";

/** Case quantity stepper with direct entry. Integers from 1 to max. */
export function QuantityInput({
  value,
  onChange,
  label,
  max = 999,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  max?: number;
}) {
  return (
    <div className="inline-flex h-9 items-stretch rounded-md border border-border bg-surface">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex w-8 items-center justify-center text-foreground-muted hover:bg-muted disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isInteger(n) && n >= 1 && n <= max) onChange(n);
        }}
        className="tabular w-12 border-x border-border bg-transparent text-center text-sm font-medium text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex w-8 items-center justify-center text-foreground-muted hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
