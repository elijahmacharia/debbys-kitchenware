import { NextResponse } from 'next/server';
import { track, type AnalyticsEventType } from '@/lib/analytics';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { readJson } from '@/lib/api';

const ALLOWED: AnalyticsEventType[] = [
  'PRODUCT_VIEW', 'SEARCH', 'ADD_TO_CART', 'REMOVE_FROM_CART',
  'CHECKOUT_STARTED', 'WHATSAPP_CLICK', 'ORDER_PLACED', 'PWA_INSTALL',
];

/**
 * Client-side analytics beacon.
 *
 * Only the fixed event names above are accepted, so this cannot be used to
 * write arbitrary rows, and it is rate limited so it cannot be used to fill the
 * database. It always answers 204 — a tracking failure must never show the
 * customer an error.
 */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, 'track'), 120, 60);
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  const body = (await readJson(request)) as { type?: string; label?: string } | null;
  const type = body?.type as AnalyticsEventType | undefined;
  if (!type || !ALLOWED.includes(type)) return new NextResponse(null, { status: 204 });

  await track(type, typeof body?.label === 'string' ? body.label : undefined);
  return new NextResponse(null, { status: 204 });
}
