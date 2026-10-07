import { getCurrentAdmin } from '@/lib/auth';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, tooManyRequests, unauthorized } from '@/lib/api';
import { saveImage } from '@/lib/media';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Staff photo upload. The browser sends one image; we store the bytes and
 * return the path the product form saves.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return unauthorized('Please sign in to the staff dashboard.');

    const limit = rateLimit(clientKey(request, `upload:${admin.id}`), 40, 10 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('Choose a photo to upload.');

    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      const url = await saveImage(bytes);
      return ok({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The photo could not be saved.';
      if (message.startsWith('That photo') || message.startsWith('Use a ')) return fail(message);
      throw error;
    }
  });
}
