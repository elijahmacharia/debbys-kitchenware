import Link from 'next/link';
import { cn } from '@/lib/cn';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

/**
 * Server-rendered pagination built from real links, not buttons: the page is
 * shareable, works with the back button, is crawlable, and still works before
 * JavaScript has loaded.
 */
export function Pagination({
  page, totalPages, buildHref,
}: { page: number; totalPages: number; buildHref: (page: number) => string }) {
  if (totalPages <= 1) return null;

  // First, last, current and its neighbours; gaps become an ellipsis.
  const pages: (number | 'gap')[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  const base = 'inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-control border px-3 text-sm font-medium';

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} rel="prev" className={cn(base, 'border-line bg-surface hover:bg-clay-50')} aria-label="Previous page">
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </Link>
      ) : null}

      {pages.map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-subtle" aria-hidden="true">…</span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Page ${entry}`}
            className={cn(base, entry === page ? 'border-clay-600 bg-clay-600 text-white' : 'border-line bg-surface hover:bg-clay-50')}
          >
            {entry}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} rel="next" className={cn(base, 'border-line bg-surface hover:bg-clay-50')} aria-label="Next page">
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
