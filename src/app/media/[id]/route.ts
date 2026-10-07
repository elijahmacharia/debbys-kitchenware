import { readImage } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public product and category photos. The id is unguessable; the bytes are not secret. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const image = await readImage(id);
  if (!image) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.contentType,
      'Content-Length': String(image.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
