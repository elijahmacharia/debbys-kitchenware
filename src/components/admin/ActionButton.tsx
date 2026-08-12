'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import type { ActionResult } from '@/app/(admin)/admin/actions';

/**
 * Runs a server action and reports the result as a toast.
 *
 * `confirmMessage` turns it into a two-step action for anything destructive,
 * so a mis-tap cannot delete a product.
 */
export function ActionButton({
  action, children, confirmMessage, className, variant = 'secondary', size = 'sm', title,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  confirmMessage?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const run = async () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const result = await action();
      if (result.message) push(result.message, result.ok ? 'success' : 'error');
      else if (!result.ok) push('That did not work. Please try again.', 'error');
      if (result.ok) startTransition(() => router.refresh());
    } catch {
      push('Something went wrong. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const variants = {
    primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost border border-line',
  } as const;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || pending}
      title={title}
      className={cn(variants[variant], size === 'sm' && 'btn-sm', className)}
    >
      {children}
    </button>
  );
}
