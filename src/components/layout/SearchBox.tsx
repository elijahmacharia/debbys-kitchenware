'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatKsh } from '@/lib/money';
import { SearchIcon, SpinnerIcon, XIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface Suggestion {
  name: string; slug: string; sku: string;
  priceCents: number; salePriceCents: number | null; stock: number; categoryName: string;
}

/**
 * Search with typeahead.
 *
 * It is a real <form> with a real submit, so pressing Enter searches even
 * before the suggestion JavaScript has loaded. Suggestions are a progressive
 * enhancement on top, debounced so a fast typist triggers one request rather
 * than one per keystroke, with in-flight requests aborted.
 */
export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setTerm(params.get('q') ?? ''); }, [params]);

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results ?? []);
          setOpen(true);
          setHighlight(-1);
        }
      } catch {
        // Aborted or offline — leave the previous suggestions in place.
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    setOpen(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (event.key === 'Enter' && highlight >= 0) {
      event.preventDefault();
      setOpen(false);
      router.push(`/product/${suggestions[highlight].slug}`);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={submit} role="search">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            id="site-search"
            name="q"
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search buckets, plates, brooms…"
            className="input pl-9 pr-16"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loading ? <SpinnerIcon className="h-4 w-4 text-subtle" /> : null}
            {term ? (
              <button
                type="button"
                onClick={() => { setTerm(''); setSuggestions([]); setOpen(false); }}
                className="rounded p-1 text-subtle hover:bg-canvas hover:text-ink"
                aria-label="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {open ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-auto rounded-card border border-line bg-surface py-1 shadow-pop"
        >
          {suggestions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted">
              No matches for “{term.trim()}”.{' '}
              <Link href="/shop" className="link" onClick={() => setOpen(false)}>Browse all products</Link>
            </div>
          ) : (
            <>
              {suggestions.map((item, index) => (
                <Link
                  key={item.slug}
                  href={`/product/${item.slug}`}
                  role="option"
                  aria-selected={index === highlight}
                  onClick={() => setOpen(false)}
                  className={cn('flex items-center justify-between gap-3 px-3 py-2.5 text-sm', index === highlight ? 'bg-clay-50' : 'hover:bg-canvas')}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{item.name}</span>
                    <span className="block truncate text-xs text-muted">{item.categoryName}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold">{formatKsh(item.salePriceCents ?? item.priceCents)}</span>
                    {item.stock <= 0 ? <span className="text-[11px] text-danger">Out of stock</span> : null}
                  </span>
                </Link>
              ))}
              <button
                type="button"
                onClick={submit}
                className="w-full border-t border-line px-3 py-2.5 text-left text-sm font-medium text-clay-700 hover:bg-canvas"
              >
                See all results for “{term.trim()}”
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
