'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { adjustStockAction } from '@/app/(admin)/admin/actions';

/**
 * Inline stock editor. The owner types the number they actually counted on the
 * shelf; the difference is worked out and recorded as a stock movement, so the
 * history explains itself later.
 */
export function StockAdjustForm({ productId, currentStock }: { productId: string; currentStock: number }) {
  const [value, setValue] = useState(String(currentStock));
  const [saving, setSaving] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.set('productId', productId);
      form.set('newStock', value);
      const result = await adjustStockAction(form);
      push(result.message ?? (result.ok ? 'Saved' : 'That did not work'), result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <label className="sr-only" htmlFor={`stock-${productId}`}>New stock count</label>
      <input
        id={`stock-${productId}`}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input h-9 w-20 py-0 text-sm"
      />
      <button type="submit" disabled={saving || value === String(currentStock)} className="btn-secondary btn-sm">
        {saving ? '…' : 'Set'}
      </button>
    </form>
  );
}
