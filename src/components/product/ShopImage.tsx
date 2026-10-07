import Image, { type ImageProps } from 'next/image';

/**
 * next/image reads local files out of `public/`. A photo stored in the
 * database is served by `/media/[id]`, so the optimiser cannot see it and
 * must be skipped. The browser then requests that path directly.
 */
export function isDirectImage(src: string): boolean {
  return src.startsWith('/media/') || src.startsWith('https://') || src.startsWith('http://');
}

export function ShopImage({ src, unoptimized, ...props }: ImageProps) {
  const source = typeof src === 'string' ? src : '';
  return <Image src={src} unoptimized={unoptimized || isDirectImage(source)} {...props} />;
}
