import { and, eq, ne, or } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { getCustomerSession, startCustomerSession } from '@/lib/auth';
import { profileSchema } from '@/lib/validation';
import { fail, handle, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

/**
 * Update the signed-in customer's own details.
 *
 * The customer id comes from the session cookie, never from the request body,
 * so there is no field a caller could set to edit somebody else's profile.
 */
export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const parsed = profileSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const { name, phone, email } = parsed.data;

    const clash = await db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .where(and(
        ne(customers.id, session.sub),
        email ? or(eq(customers.phone, phone), eq(customers.email, email)) : eq(customers.phone, phone),
      ))
      .limit(1);

    if (clash.length > 0) {
      const field = clash[0].phone === phone ? 'phone' : 'email';
      return fail('Those details are already used by another account', 409, { [field]: 'Already in use by another account' });
    }

    await db.update(customers).set({ name, phone, email: email ?? null }).where(eq(customers.id, session.sub));

    // Re-issue the session so the greeting in the header shows the new name.
    await startCustomerSession({ id: session.sub, name });

    return ok({ message: 'Your details have been updated.' });
  });
}
