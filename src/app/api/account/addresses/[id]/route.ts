import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { getCustomerSession } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';
import { handle, notFound, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

/**
 * Every query below is scoped by BOTH the address id and the session's
 * customer id. Guessing another customer's address id therefore achieves
 * nothing: the WHERE clause matches no rows and the caller gets a 404.
 */

async function ownedAddress(addressId: string, customerId: string) {
  const [row] = await db
    .select({ id: addresses.id, isDefault: addresses.isDefault })
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)))
    .limit(1);
  return row ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();
    const { id } = await params;

    if (!(await ownedAddress(id, session.sub))) return notFound('Address not found');

    const parsed = addressSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const data = parsed.data;

    await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, session.sub));
      }
      await tx.update(addresses)
        .set({
          label: data.label,
          recipientName: data.recipientName,
          phone: data.phone,
          county: data.county,
          town: data.town,
          area: data.area,
          estate: data.estate ?? null,
          building: data.building ?? null,
          landmark: data.landmark ?? null,
          directions: data.directions ?? null,
          isDefault: data.isDefault,
        })
        .where(and(eq(addresses.id, id), eq(addresses.customerId, session.sub)));
    });

    return ok({ message: 'Address updated' });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();
    const { id } = await params;

    const owned = await ownedAddress(id, session.sub);
    if (!owned) return notFound('Address not found');

    await db.transaction(async (tx) => {
      await tx.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, session.sub)));

      // Never leave a customer with addresses but no default.
      if (owned.isDefault) {
        const [next] = await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.customerId, session.sub)).limit(1);
        if (next) await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
      }
    });

    return ok({ message: 'Address deleted' });
  });
}
