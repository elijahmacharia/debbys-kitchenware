import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { getCustomerSession, hashPassword, verifyPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, unauthorized, validationFailed } from '@/lib/api';

/** Changing a password requires proving you know the current one. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const limit = rateLimit(clientKey(request, `pwchange:${session.sub}`), 5, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = changePasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const [customer] = await db
      .select({ passwordHash: customers.passwordHash })
      .from(customers)
      .where(eq(customers.id, session.sub))
      .limit(1);
    if (!customer) return unauthorized();

    if (!(await verifyPassword(parsed.data.currentPassword, customer.passwordHash))) {
      return fail('Your current password is not correct', 400, { currentPassword: 'Incorrect password' });
    }

    await db
      .update(customers)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
      .where(eq(customers.id, session.sub));

    return ok({ message: 'Your password has been changed.' });
  });
}
