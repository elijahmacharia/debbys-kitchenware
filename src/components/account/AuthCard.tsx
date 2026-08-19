import Link from 'next/link';
import type { ReactNode } from 'react';
import { business } from '@/lib/config';
import { PotMark } from '@/components/brand/PotMark';

/**
 * Shared shell for sign in, register and password reset.
 *
 * These pages render without the site header, so the mark and shop name are
 * repeated here. Without them the screen would give no indication of whose
 * site is asking for a password, which is exactly the shape of a phishing
 * page and worth avoiding.
 *
 * The mark links home and the guest line sits underneath, so leaving is always
 * possible even with the navigation stripped away.
 */
export function AuthCard({
  title, subtitle, children, footer,
}: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-site flex flex-1 items-center justify-center py-10 sm:py-14">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-6 flex w-fit items-center gap-2.5" aria-label={`${business.name} home`}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-surface">
            <PotMark className="h-7 w-7" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">{business.name}</span>
        </Link>

        <div className="card p-5 sm:p-6">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-5 space-y-4">{children}</div>
        </div>

        {footer ? <div className="mt-4 text-center text-sm text-muted">{footer}</div> : null}
        <p className="mt-6 text-center text-xs text-muted">
          No account needed to shop. <Link href="/shop" className="link">Continue as a guest</Link>
        </p>
      </div>
    </div>
  );
}
