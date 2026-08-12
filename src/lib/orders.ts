/**
 * Order status vocabulary, shared by the customer timeline, the admin status
 * picker and the API validator so the three can never drift apart.
 */

export const ORDER_STATUSES = [
  'NEW', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface StatusMeta {
  label: string;
  /** Sentence shown to the customer on the tracking timeline. */
  customerText: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  NEW: { label: 'Order placed', customerText: 'We have received your order and will confirm it shortly.' },
  CONFIRMED: { label: 'Confirmed', customerText: 'We have confirmed your order and stock is reserved for you.' },
  PROCESSING: { label: 'Being packed', customerText: 'Your items are being packed.' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', customerText: 'Your order is packed and waiting for you at the shop.' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', customerText: 'Your order is on the way to you.' },
  DELIVERED: { label: 'Delivered', customerText: 'Your order has been handed over. Thank you for shopping with us.' },
  CANCELLED: { label: 'Cancelled', customerText: 'This order was cancelled.' },
};

/**
 * The stages a given order can pass through. A pickup order never shows
 * "Out for delivery" and a delivery order never shows "Ready for pickup", so
 * the timeline only ever contains steps that apply to this customer.
 */
export function timelineFor(fulfilment: string): OrderStatus[] {
  return fulfilment === 'PICKUP'
    ? ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED']
    : ['NEW', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
}

/** For pickup orders the final step reads "Collected" rather than "Delivered". */
export function stageLabel(status: OrderStatus, fulfilment: string): string {
  if (status === 'DELIVERED' && fulfilment === 'PICKUP') return 'Collected';
  return STATUS_META[status].label;
}

export const isTerminal = (status: string) => status === 'DELIVERED' || status === 'CANCELLED';

/** Statuses an order can legally move to. Prevents nonsensical transitions. */
export function allowedNextStatuses(current: string, fulfilment: string): OrderStatus[] {
  if (isTerminal(current)) return [];
  const path = timelineFor(fulfilment);
  const index = path.indexOf(current as OrderStatus);
  const forward = index === -1 ? path : path.slice(index + 1);
  return [...forward, 'CANCELLED'];
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Payment failed',
};

/**
 * DK-YYMM-NNNN. Readable over the phone, sortable, and the sequence resets
 * monthly so numbers stay short. `sequence` is the count of orders this month.
 */
export function buildOrderNumber(date: Date, sequence: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `DK-${yy}${mm}-${String(sequence).padStart(4, '0')}`;
}

export const FULFILMENT_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Shop pickup',
};
