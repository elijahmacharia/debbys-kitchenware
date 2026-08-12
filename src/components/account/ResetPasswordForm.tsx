'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Alert tone="error" title="This link is not valid">
        The reset link is missing its token. <Link href="/forgot-password" className="link">Request a new one</Link>.
      </Alert>
    );
  }

  if (done) {
    return (
      <Alert tone="success" title="Password changed">
        You can now <Link href="/login" className="link">sign in</Link> with your new password.
      </Alert>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const problems: Record<string, string> = {};
    if (password.length < 8) problems.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) problems.password = 'Include a letter and a number';
    if (password !== confirm) problems.confirm = 'The two passwords do not match';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'We could not reset your password.');
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError('We could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <TextField
        label="New password" required type="password" autoComplete="new-password" autoFocus
        value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
        hint="8+ characters, with a letter and a number."
      />
      <TextField
        label="Confirm new password" required type="password" autoComplete="new-password"
        value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm}
      />
      <Button type="submit" fullWidth loading={submitting}>{submitting ? 'Saving…' : 'Change password'}</Button>
    </form>
  );
}
