'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@/components/icons';
import type { MenuCategory } from './MobileMenu';

/** Desktop "Categories" dropdown. Opens on hover or on click/Enter. */
export function CategoryMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-1 px-3 text-sm font-medium text-ink hover:text-clay-700"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Categories
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 w-[42rem] max-w-[calc(100vw-2rem)] rounded-card border border-line bg-surface p-4 shadow-pop">
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            {categories.map((category) => (
              <div key={category.slug}>
                <Link href={`/category/${category.slug}`} className="block text-sm font-semibold text-ink hover:text-clay-700">
                  {category.name}
                </Link>
                {category.children.length > 0 ? (
                  <ul className="mt-1.5 space-y-1">
                    {category.children.slice(0, 5).map((child) => (
                      <li key={child.slug}>
                        <Link href={`/category/${child.slug}`} className="block text-[13px] text-muted hover:text-clay-700">
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
          <Link href="/categories" className="mt-4 inline-block border-t border-line pt-3 text-sm font-medium text-clay-700 hover:underline">
            View all categories →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
