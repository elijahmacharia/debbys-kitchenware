import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { hashPassword, startCustomerSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

/**
 * Customer registration: email and password, nothing more.
 *
 * A phone number is not asked for here. Checkout collects one on every order,
 * which is where it actually matters, and Google sign-in cannot supply one at
 * all — so requiring it up front would have blocked that route entirely.
 *
 * If the email already belongs to a Google-only account, we say so plainly
 * rather than refusing without explanation, because the person does have an
 * account, just not a password on it.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'register'), 10, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = registerSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const { email, password, marketingOptIn } = parsed.data;

    const [existing] = await db
      .select({ id: customers.id, googleId: customers.googleId, passwordHash: customers.passwordHash })
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existing) {
      // Being specific is right here: the person is trying to create an
      // account and needs to know how to get into the one they already have.
      const viaGoogle = Boolean(existing.googleId) && !existing.passwordHash;
      return fail(
        viaGoogle
          ? 'This email is already registered through Google. Use the "Continue with Google" button to sign in.'
          : 'An account already exists with this email address. Please sign in instead.',
        409,
        { email: 'Already registered' },
      );
    }

    const [customer] = await db
      .insert(customers)
      .values({
        email,
        passwordHash: await hashPassword(password),
        marketingOptIn: Boolean(marketingOptIn),
        lastLoginAt: new Date(),
      })
      .returning({ id: customers.id, name: customers.name, email: customers.email });

    await startCustomerSession(customer);
    return ok({ id: customer.id, name: customer.name }, { status: 201 });
  });
}
