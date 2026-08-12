'use client';

import { useState } from 'react';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.error ?? 'Something went wrong. Please try again.');
      else setMessage(data.message);
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (message) return <Alert tone="success" title="Check your messages">{message}</Alert>;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <TextField label="Phone number or email" required autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="0712345678" />
      <Button type="submit" fullWidth loading={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</Button>
      <p className="text-xs leading-relaxed text-muted">
        We give the same answer either way, for your security. Nothing arrived? Contact us.
      </p>
    </form>
  );
}
