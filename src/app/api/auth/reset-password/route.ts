import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { customers, passwordResetTokens } from '@/db/schema';
import { hashPassword, hashResetToken } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';

/**
 * Completes a password reset.
 *
 * The token is looked up by its SHA-256 hash — the raw value is never stored —
 * and must be unused and unexpired. It is marked used in the same transaction
 * as the password change, so a link cannot be replayed.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'reset'), 10, 15 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = resetPasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const tokenHash = hashResetToken(parsed.data.token);
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ))
      .limit(1);

    if (!row) return fail('This reset link is invalid or has expired. Please request a new one.', 400);

    const passwordHash = await hashPassword(parsed.data.password);

    await db.transaction(async (tx) => {
      await tx.update(customers).set({ passwordHash }).where(eq(customers.id, row.customerId));
      // Any other outstanding links for this account are burned too.
      await tx.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.customerId, row.customerId), isNull(passwordResetTokens.usedAt)));
    });

    return ok({ message: 'Your password has been changed. You can now sign in.' });
  });
}
