import Link from 'next/link';
import { business } from '@/lib/config';
import { PotMark } from '@/components/brand/PotMark';

/**
 * The pot mark plus the shop name, so the header matches the browser tab and
 * the installed app icon. Drawn rather than loaded as an image file: it is
 * sharp at every size, needs no download and cannot cause a layout shift.
 * Swap in an <Image> here when real artwork arrives.
 */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className ?? ''}`} aria-label={`${business.name} home`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-surface">
        <PotMark className="h-6 w-6" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block truncate text-[1.15rem] font-semibold tracking-tight text-ink sm:text-[1.3rem]">
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
