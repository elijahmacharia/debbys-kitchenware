'use client';

import { useState } from 'react';
import { CheckboxField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/** Opt-in preference. Off by default for everyone; never assumed. */
export function MarketingToggle({ initial }: { initial: boolean }) {
  const [optIn, setOptIn] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingOptIn: optIn }),
      });
      if (!response.ok) throw new Error();
      setMessage('Your preference has been saved.');
    } catch {
      setError('We could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card space-y-3 p-4 sm:p-5">
      <h2 className="text-base font-bold">Offers and new products</h2>
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <CheckboxField
        label="Let me know about new products and special offers"
        checked={optIn}
        onChange={(e) => { setOptIn(e.target.checked); setMessage(null); }}
        hint="We will only use this for occasional updates, never for anything else."
      />
      <Button size="sm" onClick={save} loading={saving} type="button">{saving ? 'Saving…' : 'Save preference'}</Button>
    </section>
  );
}
