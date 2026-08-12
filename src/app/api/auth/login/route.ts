import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { cartItems, customers } from '@/db/schema';
import { startCustomerSession, verifyPassword, wastePasswordTime } from '@/lib/auth';
import { loginSchema, normalizeKenyanPhone } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

/**
 * Sign in with either a phone number or an email address.
 *
 * Two security details worth naming:
 *  - The same message is returned whether the account does not exist or the
 *    password is wrong, so this endpoint cannot be used to discover which
 *    phone numbers are registered.
 *  - When no account matches we still run a bcrypt comparison against a dummy
 *    hash, so both outcomes take a similar time and the difference cannot be
 *    measured either.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'login'), 10, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const { identifier, password } = parsed.data;
    const asPhone = normalizeKenyanPhone(identifier);
    const asEmail = identifier.includes('@') ? identifier.trim().toLowerCase() : null;

    if (!asPhone && !asEmail) {
      return fail('Enter the phone number or email address you registered with', 400, {
        identifier: 'Enter a valid phone number or email address',
      });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(
        asPhone && asEmail ? or(eq(customers.phone, asPhone), eq(customers.email, asEmail))
          : asPhone ? eq(customers.phone, asPhone)
          : eq(customers.email, asEmail as string),
      )
      .limit(1);

    const GENERIC = 'Those details do not match an account. Please check and try again.';

    if (!customer) {
      await wastePasswordTime();
      return fail(GENERIC, 401);
    }
    if (!(await verifyPassword(password, customer.passwordHash))) return fail(GENERIC, 401);
    if (!customer.isActive) {
      return fail('This account has been disabled. Please contact us if you think this is a mistake.', 403);
    }

    await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, customer.id));
    await startCustomerSession({ id: customer.id, name: customer.name });

    // The saved cart is returned so the browser can merge it with whatever the
    // customer put in the cart while signed out.
    const savedCart = await db
      .select({ productId: cartItems.productId, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.customerId, customer.id));

    return ok({ id: customer.id, name: customer.name, savedCart });
  });
}
