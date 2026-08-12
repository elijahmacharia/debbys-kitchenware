import Link from 'next/link';
import type { ReactNode } from 'react';
import { business } from '@/lib/config';

/** Shared shell for sign in, register and password reset. */
export function AuthCard({
  title, subtitle, children, footer,
}: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-site flex justify-center py-10 sm:py-14">
      <div className="w-full max-w-md">
        <div className="card p-5 sm:p-6">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>
        {footer ? <div className="mt-4 text-center text-sm text-muted">{footer}</div> : null}
        <p className="mt-6 text-center text-xs text-muted">
          No account needed to shop. <Link href="/shop" className="link">Continue as a guest</Link>
        </p>
      </div>
    </div>
  );
}
