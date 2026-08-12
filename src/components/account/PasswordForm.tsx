'use client';

import { useState } from 'react';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const problems: Record<string, string> = {};
    if (!current) problems.currentPassword = 'Enter your current password';
    if (next.length < 8) problems.newPassword = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) problems.newPassword = 'Include a letter and a number';
    if (next !== confirm) problems.confirm = 'The two passwords do not match';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setError(data.error ?? 'We could not change your password.');
        return;
      }
      setMessage(data.message);
      setCurrent(''); setNext(''); setConfirm('');
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-4 sm:p-5">
      <h2 className="text-base font-bold">Change your password</h2>
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <TextField label="Current password" required type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} />
      <TextField label="New password" required type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} hint="At least 8 characters, including a letter and a number." />
      <TextField label="Confirm new password" required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />

      <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Change password'}</Button>
    </form>
  );
}
