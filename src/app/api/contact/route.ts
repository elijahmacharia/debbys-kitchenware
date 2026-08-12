import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { contactSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'contact'), 5, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = contactSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    // Honeypot: a hidden field that only an automated form filler populates.
    // Answer as if it worked so the bot learns nothing.
    if (parsed.data.website) return ok({ message: 'Thank you, we have received your message.' });

    await db.insert(contactMessages).values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });

    return ok({ message: 'Thank you. We have received your message and will get back to you as soon as we can.' });
  });
}
