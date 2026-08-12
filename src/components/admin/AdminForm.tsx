'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { ActionResult } from '@/app/(admin)/admin/actions';

/**
 * Wraps an admin form around a server action.
 *
 * Children receive the per-field errors the action returned, so validation
 * messages appear next to the field that caused them rather than as one vague
 * banner. On success the page refreshes so server-rendered lists update.
 */
export function AdminForm({
  action, children, submitLabel, onSuccess, redirectTo, className, secondary,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  children: (errors: Record<string, string>) => React.ReactNode;
  submitLabel: string;
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
  secondary?: React.ReactNode;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError(null);
    setErrors({});

    try {
      const result = await action(new FormData(event.currentTarget));
      if (!result.ok) {
        setErrors(result.fields ?? {});
        setFormError(result.message ?? (result.fields ? 'Please check the highlighted fields.' : 'That did not work.'));
        return;
      }
      if (result.message) push(result.message);
      onSuccess?.();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className={className}>
      {formError ? <Alert tone="error" className="mb-4">{formError}</Alert> : null}
      {children(errors)}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>{saving ? 'Saving…' : submitLabel}</Button>
        {secondary}
      </div>
    </form>
  );
}
