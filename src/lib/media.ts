import 'server-only';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import { categories, mediaFiles, orderItems, productImages } from '@/db/schema';
import { createId } from '@/lib/id';

/**
 * Photos are stored in Postgres so they survive a deploy.
 *
 * Writing into `public/uploads` works on a laptop and vanishes on Vercel: the
 * server has no durable disk, and the next deployment replaces the files.
 */

const MAX_BYTES = 2_500_000;

let ready: Promise<void> | null = null;

/** Creates the table if this database was set up before photo upload existed. */
export function ensureMediaTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const found = await db.execute(sql`select to_regclass('public.media_files') as name`);
      const row = found[0] as { name: string | null } | undefined;
      if (row?.name) return;
      await db.execute(sql`
        CREATE TABLE media_files (
          id text PRIMARY KEY,
          content_type text NOT NULL,
          byte_size integer NOT NULL,
          data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

/** JPEG, PNG, GIF or WEBP, decided from the file itself rather than its name. */
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 6) {
    const head = bytes.toString('ascii', 0, 6);
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function saveImage(bytes: Buffer): Promise<string> {
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error('That photo is too large. Try a smaller one.');
  }
  const contentType = sniffImageType(bytes);
  if (!contentType) {
    throw new Error('Use a JPG, PNG, WEBP or GIF photo.');
  }
  await ensureMediaTable();
  const id = createId();
  await db.insert(mediaFiles).values({
    id,
    contentType,
    byteSize: bytes.length,
    data: bytes,
  });
  return `/media/${id}`;
}

export async function readImage(id: string): Promise<{ contentType: string; data: Buffer } | null> {
  if (!/^[a-z0-9]{24}$/.test(id)) return null;
  await ensureMediaTable();
  const [row] = await db
    .select({ contentType: mediaFiles.contentType, data: mediaFiles.data })
    .from(mediaFiles)
    .where(eq(mediaFiles.id, id))
    .limit(1);
  if (!row) return null;
  return { contentType: row.contentType, data: row.data };
}

export function mediaIdFromUrl(url: string): string | null {
  const match = /^\/media\/([a-z0-9]{24})$/.exec(url);
  return match?.[1] ?? null;
}

/**
 * Deletes photo bytes that nothing points at anymore.
 *
 * Order lines keep their snapshot URL, so a photo that was sold stays even
 * after the product is removed.
 */
export async function releaseMedia(urls: string[]) {
  const ids = [...new Set(urls.map(mediaIdFromUrl).filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;
  await ensureMediaTable();
  for (const id of ids) {
    const url = `/media/${id}`;
    const [image] = await db.select({ id: productImages.id }).from(productImages).where(eq(productImages.url, url)).limit(1);
    if (image) continue;
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.imageUrl, url)).limit(1);
    if (category) continue;
    const [sold] = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.imageUrl, url)).limit(1);
    if (sold) continue;
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  }
}
