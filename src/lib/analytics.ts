import 'server-only';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';

/**
 * First-party event log. No third-party script, no cookie, no personal data —
 * just counts the owner can use. Google Analytics can be layered on top by
 * setting NEXT_PUBLIC_GA_MEASUREMENT_ID; this table keeps working either way.
 */
export type AnalyticsEventType =
  | 'PRODUCT_VIEW' | 'SEARCH' | 'ADD_TO_CART' | 'REMOVE_FROM_CART'
  | 'CHECKOUT_STARTED' | 'WHATSAPP_CLICK' | 'ORDER_PLACED' | 'PWA_INSTALL';

/**
 * Analytics must never be able to break a page. Failures are swallowed
 * deliberately: a logging problem is not worth a 500 on a product page.
 */
export async function track(type: AnalyticsEventType, label?: string, valueCents?: number): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({ type, label: label?.slice(0, 200), valueCents });
  } catch (error) {
    console.error('[analytics] failed to record event', type, error);
  }
}
