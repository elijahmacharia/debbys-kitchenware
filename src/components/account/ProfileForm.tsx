'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ProfileForm({ customer }: { customer: { name: string; phone: string; email: string | null } }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone, email: customer.email ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: '' }));
    setMessage(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setError(data.error ?? 'We could not save your details.');
        return;
      }
      setMessage(data.message);
      router.refresh();
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-4 sm:p-5">
      <h2 className="text-base font-bold">Your details</h2>
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <TextField label="Full name" required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <TextField
        label="Phone number" required type="tel" autoComplete="tel"
        value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone}
        hint="Also your sign-in name."
      />
      <TextField label="Email address" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />

      <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
    </form>
  );
}
