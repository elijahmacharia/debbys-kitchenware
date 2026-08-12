'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'Sign in failed.');
        setSubmitting(false);
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('We could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <TextField label="Email" required type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" fullWidth loading={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
      <p className="text-xs leading-relaxed text-muted">
        Sessions expire after 8 hours. Repeated failed attempts are temporarily blocked.
      </p>
    </form>
  );
}
