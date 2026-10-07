import { business, whatsappNumber } from './config';
import { formatKsh } from './money';

/**
 * Every WhatsApp link in the app is built here, so the number lives in exactly
 * one place and the message is always generated from real data.
 */

export interface WhatsAppLine { name: string; quantity: number; unitPriceCents: number }

export interface WhatsAppOrderContext {
  lines: WhatsAppLine[];
  subtotalCents: number;
  deliveryFeeCents?: number;
  totalCents: number;
  customerName?: string;
  customerPhone?: string;
  fulfilment?: 'DELIVERY' | 'PICKUP';
  county?: string;
  town?: string;
  area?: string;
  estate?: string;
  landmark?: string;
  directions?: string;
  note?: string;
  orderNumber?: string;
}

/**
 * null when no WhatsApp number is configured — callers then hide the button.
 * Pass `number` when the shop profile has a saved WhatsApp line; otherwise
 * the deploy-time value is used.
 */
/** 07… and 7… mobile numbers become 254… so a wa.me link reaches the shop. */
function digitsForWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

export function waLink(message: string, number?: string | null): string | null {
  const digits = digitsForWhatsapp(number ?? whatsappNumber() ?? '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function generalEnquiryMessage(): string {
  return `Hello ${business.name}, I would like to ask about your products.`;
}

export function productEnquiryMessage(product: {
  name: string; sku: string; priceCents: number; url?: string;
}): string {
  const lines = [
    `Hello ${business.name},`,
    '',
    'I am interested in this product:',
    `${product.name} (${product.sku}), ${formatKsh(product.priceCents)}`,
  ];
  if (product.url) lines.push(product.url);
  lines.push('', 'Is it available?');
  return lines.join('\n');
}

/**
 * The full order message. Built from the live cart or a saved order, never
 * from a hardcoded template — the numbers here are the numbers the customer
 * saw on screen.
 */
export function orderMessage(ctx: WhatsAppOrderContext): string {
  const out: string[] = [`Hello ${business.name},`, ''];
  out.push(ctx.orderNumber
    ? `I would like to follow up on my order ${ctx.orderNumber}.`
    : 'I would like to place an order.');
  out.push('', 'Products:');

  ctx.lines.forEach((line, index) => {
    out.push(`${index + 1}. ${line.name} x ${line.quantity}, ${formatKsh(line.unitPriceCents * line.quantity)}`);
  });

  out.push('', `Subtotal: ${formatKsh(ctx.subtotalCents)}`);
  if (ctx.deliveryFeeCents !== undefined && ctx.fulfilment === 'DELIVERY') {
    out.push(`Delivery: ${ctx.deliveryFeeCents === 0 ? 'To be confirmed' : formatKsh(ctx.deliveryFeeCents)}`);
  }
  out.push(`Total: ${formatKsh(ctx.totalCents)}`);

  if (ctx.customerName || ctx.customerPhone) {
    out.push('', 'Customer:');
    if (ctx.customerName) out.push(`Name: ${ctx.customerName}`);
    if (ctx.customerPhone) out.push(`Phone: ${ctx.customerPhone}`);
  }

  if (ctx.fulfilment) {
    out.push('', `Delivery method: ${ctx.fulfilment === 'PICKUP' ? 'Shop pickup' : 'Delivery'}`);
  }

  if (ctx.fulfilment === 'DELIVERY') {
    const address = [
      ctx.county && `County: ${ctx.county}`,
      ctx.town && `Town: ${ctx.town}`,
      ctx.area && `Area: ${ctx.area}`,
      ctx.estate && `Estate: ${ctx.estate}`,
      ctx.landmark && `Landmark: ${ctx.landmark}`,
      ctx.directions && `Directions: ${ctx.directions}`,
    ].filter(Boolean) as string[];
    if (address.length) out.push('', 'Delivery details:', ...address);
  }

  if (ctx.note) out.push('', 'Additional instructions:', ctx.note);
  out.push('', 'Thank you.');
  return out.join('\n');
}
