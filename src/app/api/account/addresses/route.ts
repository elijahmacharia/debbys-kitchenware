import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { getCustomerSession } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';
import { handle, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

export async function GET() {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, session.sub))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
    return ok({ addresses: rows });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const parsed = addressSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const data = parsed.data;

    const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.customerId, session.sub));
    // The first address a customer saves becomes their default automatically.
    const makeDefault = data.isDefault || existing.length === 0;

    await db.transaction(async (tx) => {
      if (makeDefault) {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, session.sub));
      }
      await tx.insert(addresses).values({
        customerId: session.sub,
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
        isDefault: makeDefault,
      });
    });

    return ok({ message: 'Address saved' }, { status: 201 });
  });
}
