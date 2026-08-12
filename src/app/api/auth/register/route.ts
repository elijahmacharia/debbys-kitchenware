import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { hashPassword, startCustomerSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

/**
 * Customer registration.
 *
 * The phone number is the primary identity because that is what a Kenyan
 * customer will remember and what we use to reach them about an order. Email
 * is optional throughout.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'register'), 5, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = registerSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const { name, phone, email, password, marketingOptIn } = parsed.data;

    const existing = await db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .where(email ? or(eq(customers.phone, phone), eq(customers.email, email)) : eq(customers.phone, phone))
      .limit(1);

    if (existing.length > 0) {
      // Registration is one of the few places where being specific is right:
      // the person is trying to create an account and needs to know which
      // field clashes so they can sign in instead.
      const clash = existing[0].phone === phone ? 'phone' : 'email';
      return fail(
        clash === 'phone'
          ? 'An account already exists with this phone number. Please sign in instead.'
          : 'An account already exists with this email address. Please sign in instead.',
        409,
        { [clash]: 'Already registered' },
      );
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name,
        phone,
        email: email ?? null,
        passwordHash: await hashPassword(password),
        marketingOptIn: Boolean(marketingOptIn),
        lastLoginAt: new Date(),
      })
      .returning({ id: customers.id, name: customers.name });

    await startCustomerSession(customer);
    return ok({ id: customer.id, name: customer.name }, { status: 201 });
  });
}
