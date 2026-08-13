'use client';

import { MinusIcon, PlusIcon } from '@/components/icons';

/**
 * Quantity control.
 *
 * The +/- buttons are the primary interaction because they are far easier to
 * hit on a phone than a small number field. Typed values are clamped to
 * 1..max, and both buttons disable at the boundaries, so a customer can never
 * order 0 or more than is in stock.
 */
export function QuantityStepper({
  value, onChange, max, min = 1, disabled, label = 'Quantity', compact,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  min?: number;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const ceiling = Math.max(min, max);
  const clamp = (next: number) => Math.max(min, Math.min(Math.floor(next) || min, ceiling));
  const buttonClass = compact
    ? 'grid h-8 w-8 place-items-center rounded-full bg-surface text-ink shadow-soft transition active:scale-90 disabled:opacity-35 disabled:shadow-none'
    : 'grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-soft transition active:scale-90 disabled:opacity-35 disabled:shadow-none';

  return (
    <div className="inline-flex items-center rounded-full bg-raise p-0.5" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} className={buttonClass} aria-label="Decrease quantity">
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={ceiling}
        disabled={disabled}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        onBlur={(event) => onChange(clamp(Number(event.target.value)))}
        aria-label={label}
        className={`${compact ? 'h-8 w-9 text-sm' : 'h-10 w-12'} bg-transparent text-center font-semibold text-ink focus:outline-none`}
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= ceiling} className={buttonClass} aria-label="Increase quantity">
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
