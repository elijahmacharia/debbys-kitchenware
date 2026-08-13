import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * A category as a picture you click, not a text link in a box.
 *
 * The image is the whole target, the label sits on a gradient scrim at the
 * bottom, and the first tile in the row runs taller than the rest — a small
 * asymmetry that stops the section reading as a uniform grid of identical
 * cards.
 */
export function CategoryCard({
  name, slug, productCount, image, tall,
}: { name: string; slug: string; productCount: number; image: string; tall?: boolean }) {
  return (
    <Link
      href={`/category/${slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-3xl bg-raise',
        tall ? 'aspect-[4/5] sm:row-span-2 sm:aspect-auto sm:h-full' : 'aspect-[4/3]',
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        loading="lazy"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      {/* Scrim, so white text stays legible whatever the picture underneath. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-base font-semibold leading-tight text-white sm:text-lg">{name}</p>
        <p className="mt-0.5 text-xs text-white/75">{productCount} products</p>
      </div>
    </Link>
  );
}
