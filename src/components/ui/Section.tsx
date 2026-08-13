import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/icons';

export function SectionHeader({
  title, description, href, linkLabel = 'View all', id,
}: { title: string; description?: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-bold sm:text-xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-clay-700 hover:underline">
          {linkLabel}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function Section({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`container-site py-8 sm:py-10 ${className ?? ''}`}>
      {children}
    </section>
  );
}
