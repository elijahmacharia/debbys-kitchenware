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
      <span className="min-w-0 leading-none">
        <span className="block truncate font-display text-[1.15rem] tracking-tight text-ink sm:text-[1.3rem]">
          {business.name}
        </span>
        {!compact ? (
          <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.16em] text-clay-600 sm:block">
            Kitchen &amp; home
          </span>
        ) : null}
      </span>
    </Link>
  );
}
