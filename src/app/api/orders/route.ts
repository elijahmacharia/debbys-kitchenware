import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { getCustomerSession, grantGuestOrderAccess } from '@/lib/auth';
import { checkoutSchema } from '@/lib/validation';
import { createOrder } from '@/lib/orders/createOrder';
import { enabledPaymentMethods } from '@/lib/config';
import { track } from '@/lib/analytics';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, readJson, tooManyRequests, validationFailed } from '@/lib/api';
import { NextResponse } from 'next/server';

/**
 * Place an order. Works for guests and signed-in customers alike — an account
 * is never required to buy.
 *
 * The response carries the order's publicId, and for a guest we also set an
 * httpOnly cookie granting access to that one order, so the confirmation page
 * can be opened without an account and without exposing anyone else's orders.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'order'), 8, 10 * 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = checkoutSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const input = parsed.data;

    // The payment method must be one the shop actually offers for this
    // fulfilment type — the list is config, so the client cannot widen it.
    const allowed = enabledPaymentMethods(input.fulfilment).map((m) => m.key as string);
    if (!allowed.includes(input.paymentMethod)) {
      return fail('That payment method is not available for this order', 400, {
        paymentMethod: 'Please choose another payment method',
      });
    }

    const session = await getCustomerSession();
    const result = await createOrder(input, session?.sub ?? null, 'WEB');

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, unavailable: result.unavailable },
        { status: result.unavailable ? 409 : 400 },
      );
    }

    // Optionally remember the delivery address for next time.
    if (session && input.saveAddress && input.fulfilment === 'DELIVERY') {
      try {
        const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.customerId, session.sub));
        await db.insert(addresses).values({
          customerId: session.sub,
          label: 'Home',
          recipientName: input.customerName,
          phone: input.customerPhone,
          county: input.county as string,
          town: input.town as string,
          area: input.area as string,
          estate: input.estate ?? null,
          building: input.building ?? null,
          landmark: input.landmark ?? null,
          directions: input.directions ?? null,
          isDefault: existing.length === 0,
        });
      } catch (error) {
        // Saving the address is a convenience. The order already succeeded and
        // must not be reported as failed because of this.
        console.error('[orders] could not save address', error);
      }
    }

    if (!session) await grantGuestOrderAccess(result.order.publicId);

    await track('ORDER_PLACED', result.order.orderNumber, result.order.totalCents);

    return ok(
      {
        orderNumber: result.order.orderNumber,
        publicId: result.order.publicId,
        totalCents: result.order.totalCents,
        redirectTo: `/order-confirmation/${result.order.publicId}`,
      },
      { status: 201 },
    );
  });
}
