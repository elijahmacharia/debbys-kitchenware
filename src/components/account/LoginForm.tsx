'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useCart } from '@/components/cart/CartProvider';

/**
 * Sign in.
 *
 * Two behaviours worth noting:
 *  - `next` is honoured so a customer sent here from a wishlist heart or from
 *    checkout returns to exactly where they were. Only same-site paths are
 *    accepted, so `?next=https://evil.example` cannot be used as an open
 *    redirect.
 *  - The account's saved cart is merged into this browser's cart on success.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { mergeServerCart } = useCart();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rawNext = params.get('next') ?? '/account';
  // Only relative, single-slash paths. Anything else goes to the account page.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';
  const reason = params.get('reason');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error ?? 'We could not sign you in. Please try again.');
        setSubmitting(false);
        return;
      }

      if (Array.isArray(data.savedCart)) await mergeServerCart(data.savedCart);

      router.push(next);
      router.refresh();
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {reason === 'wishlist' ? <Alert tone="info">Sign in to save items to your wishlist so they are there next time.</Alert> : null}
      {reason === 'protected' ? <Alert tone="info">Please sign in to view that page.</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <TextField
        label="Phone number or email" required autoComplete="username" autoFocus placeholder="0712345678"
        value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={errors.identifier}
      />

      <div>
        <TextField
          label="Password" required type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
        />
        <p className="mt-1.5 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">Forgot your password?</Link>
        </p>
      </div>

      <Button type="submit" fullWidth loading={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  );
}
