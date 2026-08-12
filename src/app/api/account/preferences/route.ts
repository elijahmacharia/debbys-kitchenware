import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { getCustomerSession } from '@/lib/auth';
import { handle, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

const schema = z.object({ marketingOptIn: z.boolean() });

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    await db.update(customers).set({ marketingOptIn: parsed.data.marketingOptIn }).where(eq(customers.id, session.sub));
    return ok({ saved: true });
  });
}
