import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { startAdminSession, verifyPassword, wastePasswordTime } from '@/lib/auth';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter your email address'),
  password: z.string().min(1, 'Enter your password'),
});

/**
 * Staff sign-in.
 *
 * Rate limited harder than the customer login (5 attempts per 15 minutes per
 * IP) because this account can change prices and read customer data. The
 * response never distinguishes an unknown email from a wrong password, and
 * admin sessions expire after 8 hours rather than 30 days.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'admin-login'), 5, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);

    const GENERIC = 'Those details are not correct.';
    if (!admin) {
      await wastePasswordTime();
      return fail(GENERIC, 401);
    }
    if (!(await verifyPassword(parsed.data.password, admin.passwordHash))) return fail(GENERIC, 401);
    if (!admin.isActive) return fail('This staff account has been disabled.', 403);

    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, admin.id));
    await startAdminSession({ id: admin.id, name: admin.name, role: admin.role });

    return ok({ name: admin.name });
  });
}
