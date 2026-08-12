import Link from 'next/link';
import { business } from '@/lib/config';

/**
 * Wordmark rather than an image file: the real logo has not been supplied yet,
 * and a text mark is sharp at every size, needs no download and cannot cause a
 * layout shift. Swap in an <Image> here when artwork arrives.
 */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className ?? ''}`} aria-label={`${business.name} home`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-base font-bold text-white" aria-hidden="true">D</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[15px] font-bold text-ink group-hover:text-brand-700 sm:text-base">{business.name}</span>
        {!compact ? <span className="hidden truncate text-[11px] text-muted sm:block">{business.tagline}</span> : null}
      </span>
    </Link>
  );
}
