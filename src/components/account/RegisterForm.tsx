'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField, CheckboxField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/**
 * Signing up asks for an email and a password, and nothing else.
 *
 * Name and phone used to be required here. They are not asked for now because
 * every extra field loses people partway through, and both are collected at
 * checkout anyway, where a delivery address makes them necessary rather than
 * merely nice to have.
 */
export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', marketingOptIn: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rawNext = params.get('next') ?? '/account';
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: '' }));
  };

  /** Same rules as the server schema, checked here for immediate feedback. */
  const validate = () => {
    const problems: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.email = 'Enter a valid email address';
    if (form.password.length < 8) problems.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      problems.password = 'Include at least one letter and one number';
    }
    setErrors(problems);
    return Object.keys(problems).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          marketingOptIn: form.marketingOptIn,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error ?? 'We could not create your account. Please try again.');
        setSubmitting(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <TextField
        label="Email address" required type="email" inputMode="email" autoComplete="email"
        value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email}
        hint="This is how you sign in."
      />
      <TextField
        label="Password" required type="password" autoComplete="new-password"
        value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password}
        hint="8+ characters, with a letter and a number."
      />

      <CheckboxField
        label="Tell me about new products and offers"
        checked={form.marketingOptIn}
        onChange={(e) => set('marketingOptIn', e.target.checked)}
      />

      <Button type="submit" fullWidth loading={submitting}>{submitting ? 'Creating your account…' : 'Create account'}</Button>

      <p className="text-center text-xs leading-relaxed text-muted">
        By creating an account you agree to our <a href="/terms" className="link">terms</a> and{' '}
        <a href="/privacy-policy" className="link">privacy policy</a>.
      </p>
    </form>
  );
}
