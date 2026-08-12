'use client';

import { useState } from 'react';
import { TextField, TextAreaField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', body: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof form, value: string) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: '' }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;

    const problems: Record<string, string> = {};
    if (form.name.trim().length < 2) problems.name = 'Please enter your name';
    if (!/^(\+?254|0)?[71]\d{8}$/.test(form.phone.replace(/[\s()-]/g, ''))) problems.phone = 'Enter a valid Kenyan phone number';
    if (form.subject.trim().length < 3) problems.subject = 'Please add a subject';
    if (form.body.trim().length < 10) problems.body = 'Please tell us a little more';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setError(data.error ?? 'We could not send your message.');
        return;
      }
      setMessage(data.message);
      setForm({ name: '', phone: '', email: '', subject: '', body: '', website: '' });
    } catch {
      setError('We could not reach the server. Please try again, or message us on WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  if (message) return <Alert tone="success" title="Message sent">{message}</Alert>;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Your name" required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <TextField label="Phone number" required type="tel" autoComplete="tel" placeholder="0712345678" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
      </div>
      <TextField label="Email address" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
      <TextField label="Subject" required value={form.subject} onChange={(e) => set('subject', e.target.value)} error={errors.subject} placeholder="e.g. Do you stock 50L storage boxes?" />
      <TextAreaField label="Message" required rows={5} value={form.body} onChange={(e) => set('body', e.target.value)} error={errors.body} />

      {/*
        Honeypot. Hidden from people with aria-hidden and tabIndex, visible to
        naive bots. A filled value makes the server discard the submission.
      */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
      </div>

      <Button type="submit" loading={sending}>{sending ? 'Sending…' : 'Send message'}</Button>
      <p className="text-xs text-muted">We reply on WhatsApp, usually.</p>
    </form>
  );
}
