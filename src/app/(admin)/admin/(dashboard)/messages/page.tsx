import type { Metadata } from 'next';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { MessageActions } from '@/components/admin/MessageActions';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MailIcon } from '@/components/icons';

function chatNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return digits.length >= 9 ? digits : null;
}

export const metadata: Metadata = { title: 'Messages', robots: { index: false, follow: false } };

export default async function AdminMessagesPage() {
  const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100);

  return (
    <div className="max-w-3xl">
      <h1>Messages</h1>
      <p className="mt-1 text-sm text-muted">
        What people sent from the contact form. Reply by phone, WhatsApp or email. Nothing here is sent back automatically.
      </p>

      {messages.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<MailIcon className="h-8 w-8" />}
            title="No messages yet"
            description="When a customer writes from the contact page, it shows up here."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-3xl bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{message.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {message.name}
                    {' · '}
                    <a href={`tel:${message.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">{message.phone}</a>
                    {message.email ? (
                      <>
                        {' · '}
                        <a href={`mailto:${message.email}`} className="hover:underline">{message.email}</a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!message.isRead ? <Badge tone="warning">New</Badge> : null}
                  <time className="text-[11px] text-subtle" dateTime={new Date(message.createdAt).toISOString()}>
                    {new Date(message.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{message.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MessageActions id={message.id} isRead={message.isRead} />
                {chatNumber(message.phone) ? (
                  <Link href={`https://wa.me/${chatNumber(message.phone)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                    WhatsApp
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
