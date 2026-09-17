'use client';
import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    <div className="quantity">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={13} />
      </button>
      <Input
        type="number"
        min={1}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isInteger(n) && n >= 1 && n <= max) onChange(n);
        }}
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
