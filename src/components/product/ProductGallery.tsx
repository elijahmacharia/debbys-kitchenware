'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * Product image gallery.
 *
 * The main image is `priority` because it is almost always the largest element
 * on the product page, so it is what Largest Contentful Paint measures.
 * Thumbnails are small and lazy, and are hidden entirely when there is only
 * one image rather than showing a row of one.
 */
export function ProductGallery({
  images, productName,
}: { images: { id: string; url: string; alt: string }[]; productName: string }) {
  const [active, setActive] = useState(0);
  // Same reasoning as the product card: a broken image should show the
  // placeholder, not a paragraph of alt text stretched across the frame.
  const [failed, setFailed] = useState<Set<string>>(new Set());

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-line bg-canvas text-subtle">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12" />
          <p className="mt-2 text-sm">No photo yet</p>
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const currentFailed = failed.has(current.id);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface">
        {currentFailed ? (
          <div className="grid h-full place-items-center text-subtle"><ImageIcon className="h-12 w-12" /></div>
        ) : (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
            onError={() => setFailed((prev) => new Set(prev).add(current.id))}
            className="object-contain p-4"
          />
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-full border bg-surface',
                index === active ? 'border-clay-600 ring-1 ring-clay-600' : 'border-line hover:border-ink',
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" loading="lazy" className="object-contain p-1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
