'use client';

import { useState } from 'react';
import { ActionButton } from './ActionButton';
import { CheckIcon } from '@/components/icons';
import { markOrderPaidAction } from '@/app/(admin)/admin/actions';

/**
 * "Mark paid" for cash and M-Pesa.
 *
 * A client component wrapping the server action, rather than a closure handed
 * down from the page. Passing `() => action(id)` from a server component to a
 * client one is not allowed and previously took the products page down with a
 * 500, so every row action is built this way now.
 */

/** Compact version for a table row: one press, no fields. */
export function MarkPaidButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton action={() => markOrderPaidAction(orderId)} variant="secondary" title="Record that this order has been paid for">
      <CheckIcon className="h-4 w-4" />
      Mark paid
    </ActionButton>
  );
}

/**
 * Fuller version for the order page, with room for an M-Pesa transaction code.
 *
 * The code is optional on purpose: cash has none, and forcing a value would
 * either block the common case or train the owner to type nonsense into it.
 */
export function MarkPaidPanel({ orderId, method }: { orderId: string; method: string }) {
  const [reference, setReference] = useState('');
  const expectsCode = /mpesa|m-pesa/i.test(method);

  return (
    <div className="rounded-3xl border border-line-strong bg-surface p-4">
      <h3 className="text-sm font-bold">Has this been paid?</h3>
      <p className="mt-1 text-sm text-muted">
        {expectsCode
          ? 'Enter the M-Pesa code from the confirmation message, then mark it paid.'
          : 'Marks the order as settled and records who confirmed it.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="mpesa-ref" className="sr-only">M-Pesa transaction code</label>
        <input
          id="mpesa-ref"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder={expectsCode ? 'e.g. SLK7XY2Z9Q' : 'Reference (optional)'}
          className="input max-w-[14rem]"
          autoComplete="off"
          spellCheck={false}
        />
        <ActionButton action={() => markOrderPaidAction(orderId, reference)} variant="primary" size="md">
          <CheckIcon className="h-4 w-4" />
          Mark as paid
        </ActionButton>
      </div>
    </div>
  );
}
