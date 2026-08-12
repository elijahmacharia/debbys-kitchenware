import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { customers, passwordResetTokens } from '@/db/schema';
import { createResetToken } from '@/lib/auth';
import { forgotPasswordSchema, normalizeKenyanPhone } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';
import { siteUrl } from '@/lib/config';

/**
 * Starts a password reset.
 *
 * ALWAYS returns the same success response, whether or not an account matched.
 * Anything else turns this endpoint into a way to test which phone numbers are
 * registered.
 *
 * DELIVERY IS NOT WIRED UP YET. No email or SMS provider is configured, so the
 * reset link is written to the server log for the operator to pass on. See
 * docs/TECHNICAL.md — swapping in a provider is a change to this one function.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'forgot'), 5, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = forgotPasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const identifier = parsed.data.identifier;
    const asPhone = normalizeKenyanPhone(identifier);
    const asEmail = identifier.includes('@') ? identifier.trim().toLowerCase() : null;

    if (asPhone || asEmail) {
      const [customer] = await db
        .select({ id: customers.id, name: customers.name, phone: customers.phone })
        .from(customers)
        .where(
          asPhone && asEmail ? or(eq(customers.phone, asPhone), eq(customers.email, asEmail))
            : asPhone ? eq(customers.phone, asPhone)
            : eq(customers.email, asEmail as string),
        )
        .limit(1);

      if (customer) {
        const { raw, hash } = createResetToken();
        await db.insert(passwordResetTokens).values({
          customerId: customer.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // one hour
        });

        console.warn(
          `\n[password-reset] No email/SMS provider is configured.\n` +
          `  Customer: ${customer.name} (${customer.phone})\n` +
          `  Reset link (valid 1 hour): ${siteUrl}/reset-password?token=${raw}\n`,
        );
      }
    }

    return ok({
      message: 'If those details match an account, we will send a reset link. If you do not receive it, contact us and we will help.',
    });
  });
}
