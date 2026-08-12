'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { SORT_OPTIONS } from '@/lib/productSort';

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-sm text-muted">Sort</label>
      <select
        id="sort"
        value={params.get('sort') ?? 'featured'}
        disabled={isPending}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === 'featured') next.delete('sort');
          else next.set('sort', event.target.value);
          next.delete('page');
          startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
        }}
        className="input h-10 w-auto min-w-[9.5rem] py-0 text-sm"
      >
        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
