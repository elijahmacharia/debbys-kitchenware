'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField, CheckboxField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', marketingOptIn: false });
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
    if (form.name.trim().length < 2) problems.name = 'Please enter your full name';
    if (!/^(\+?254|0)?[71]\d{8}$/.test(form.phone.replace(/[\s()-]/g, ''))) {
      problems.phone = 'Enter a valid Kenyan phone number, e.g. 0712345678';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) problems.email = 'Enter a valid email address';
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
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
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

      <TextField label="Full name" required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <TextField
        label="Phone number" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0712345678"
        value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone}
        hint="This is how you will sign in, and how we reach you about orders."
      />
      <TextField
        label="Email address" type="email" autoComplete="email"
        value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email}
        hint="Optional. Useful for password resets once email is set up."
      />
      <TextField
        label="Password" required type="password" autoComplete="new-password"
        value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password}
        hint="At least 8 characters, including a letter and a number."
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
