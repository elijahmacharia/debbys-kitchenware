/**
 * Single source of truth for business information and feature flags.
 *
 * Values come from environment variables so the owner can change the phone
 * number, WhatsApp line or shop address without a developer touching code.
 * Anything a browser needs is prefixed NEXT_PUBLIC_. Secrets are never read
 * from this file — see src/lib/env.server.ts for those.
 *
 * Values the business has not supplied yet stay as visible [PLACEHOLDERS] so
 * they are obvious on the page instead of quietly wrong.
 */

const env = (key: string, fallback = ''): string => {
  const raw = process.env[key];
  return raw === undefined || raw === '' ? fallback : raw;
};

/** A value is "unset" when it is blank or still a bracketed placeholder. */
export const isPlaceholder = (value: string): boolean =>
  !value || (value.trim().startsWith('[') && value.trim().endsWith(']'));

export const siteUrl = env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, '');

export const business = {
  name: env('NEXT_PUBLIC_BUSINESS_NAME', "Debby's Kitchenware"),
  shortName: env('NEXT_PUBLIC_BUSINESS_SHORT_NAME', "Debby's"),
  tagline: env('NEXT_PUBLIC_BUSINESS_TAGLINE', 'Kitchenware & household essentials'),
  phone: env('NEXT_PUBLIC_BUSINESS_PHONE', '[BUSINESS PHONE]'),
  whatsapp: env('NEXT_PUBLIC_BUSINESS_WHATSAPP', '[WHATSAPP NUMBER]'),
  email: env('NEXT_PUBLIC_BUSINESS_EMAIL', '[BUSINESS EMAIL]'),
  address: env('NEXT_PUBLIC_BUSINESS_ADDRESS', '[BUSINESS LOCATION]'),
  city: env('NEXT_PUBLIC_BUSINESS_CITY', '[TOWN]'),
  county: env('NEXT_PUBLIC_BUSINESS_COUNTY', '[COUNTY]'),
  hours: env('NEXT_PUBLIC_BUSINESS_HOURS', '[OPENING HOURS]'),
  mapsUrl: env('NEXT_PUBLIC_GOOGLE_MAPS_URL'),
  mapsEmbedUrl: env('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL'),
} as const;

export const social = [
  { name: 'Instagram', url: env('NEXT_PUBLIC_INSTAGRAM_URL') },
  { name: 'Facebook', url: env('NEXT_PUBLIC_FACEBOOK_URL') },
  { name: 'TikTok', url: env('NEXT_PUBLIC_TIKTOK_URL') },
].filter((s) => s.url.length > 0);

/** Digits-only phone usable in a wa.me link, or null if not configured. */
export const whatsappNumber = (): string | null => {
  const digits = business.whatsapp.replace(/\D/g, '');
  return digits.length >= 9 ? digits : null;
};

/** tel: href, or null if the business phone has not been supplied. */
export const telHref = (): string | null => {
  if (isPlaceholder(business.phone)) return null;
  return `tel:${business.phone.replace(/[^\d+]/g, '')}`;
};

export const mailtoHref = (): string | null =>
  isPlaceholder(business.email) ? null : `mailto:${business.email}`;

export type PaymentMethodKey =
  | 'WHATSAPP'
  | 'MPESA_TILL'
  | 'MPESA_PAYBILL'
  | 'MPESA_SEND_MONEY'
  | 'CASH_ON_DELIVERY'
  | 'PAY_ON_PICKUP';

export interface PaymentMethodConfig {
  key: PaymentMethodKey;
  label: string;
  /** Instructions rendered to the customer. Never claims payment succeeded. */
  instructions: string;
  enabled: boolean;
  /** Some methods only make sense for one fulfilment type. */
  appliesTo: 'both' | 'DELIVERY' | 'PICKUP';
}

const till = env('NEXT_PUBLIC_MPESA_TILL');
const paybill = env('NEXT_PUBLIC_MPESA_PAYBILL');
const paybillAccount = env('NEXT_PUBLIC_MPESA_PAYBILL_ACCOUNT', 'Your phone number');
const sendMoneyName = env('NEXT_PUBLIC_MPESA_SEND_MONEY_NAME');

export const paymentMethods: PaymentMethodConfig[] = [
  {
    /*
     * Ordering "on WhatsApp" still goes through checkout, so the order is
     * recorded and stock is reserved. The customer is handed to WhatsApp
     * afterwards with their order number, to settle payment there. Letting
     * WhatsApp skip checkout meant no order record and no stock decrement.
     */
    key: 'WHATSAPP',
    label: 'Arrange on WhatsApp',
    instructions:
      'Place the order, then we will confirm it and take payment with you on WhatsApp. You will get a WhatsApp button with your order number on the next screen.',
    enabled: true,
    appliesTo: 'both',
  },
  {
    key: 'MPESA_TILL',
    label: 'M-Pesa (Buy Goods, Till)',
    instructions: isPlaceholder(till)
      ? 'M-Pesa Till number has not been configured yet. We will send you payment details on WhatsApp after you place your order.'
      : `Go to M-Pesa > Lipa na M-Pesa > Buy Goods and Services. Enter Till Number ${till}, then the order total. Send us the M-Pesa confirmation message on WhatsApp so we can confirm your order.`,
    enabled: true,
    appliesTo: 'both',
  },
  {
    key: 'MPESA_PAYBILL',
    label: 'M-Pesa (Paybill)',
    instructions: isPlaceholder(paybill)
      ? ''
      : `Go to M-Pesa > Lipa na M-Pesa > Pay Bill. Business Number ${paybill}, Account Number: ${paybillAccount}. Then send us the confirmation message on WhatsApp.`,
    enabled: !isPlaceholder(paybill),
    appliesTo: 'both',
  },
  {
    key: 'MPESA_SEND_MONEY',
    label: 'M-Pesa (Send Money)',
    instructions: isPlaceholder(sendMoneyName)
      ? ''
      : `Send the order total to ${business.phone} (${sendMoneyName}) using M-Pesa Send Money, then share the confirmation message with us on WhatsApp.`,
    enabled: !isPlaceholder(sendMoneyName) && !isPlaceholder(business.phone),
    appliesTo: 'both',
  },
  {
    key: 'CASH_ON_DELIVERY',
    label: 'Cash on delivery',
    instructions: 'Pay our rider in cash when your order arrives. Please have the exact amount ready where possible.',
    enabled: env('NEXT_PUBLIC_ENABLE_CASH_ON_DELIVERY', 'true') === 'true',
    appliesTo: 'DELIVERY',
  },
  {
    key: 'PAY_ON_PICKUP',
    label: 'Pay at the shop on pickup',
    instructions: 'Pay by cash or M-Pesa when you collect your order from our shop.',
    enabled: env('NEXT_PUBLIC_ENABLE_PAY_ON_PICKUP', 'true') === 'true',
    appliesTo: 'PICKUP',
  },
];

export const enabledPaymentMethods = (fulfilment?: 'DELIVERY' | 'PICKUP') =>
  paymentMethods.filter(
    (m) => m.enabled && (m.appliesTo === 'both' || !fulfilment || m.appliesTo === fulfilment),
  );

export const paymentMethodLabel = (key: string): string =>
  paymentMethods.find((m) => m.key === key)?.label ?? key;

export const analytics = {
  gaMeasurementId: env('NEXT_PUBLIC_GA_MEASUREMENT_ID'),
  gscVerification: env('NEXT_PUBLIC_GSC_VERIFICATION'),
} as const;

/** Kenyan counties, used for the delivery address form. */
export const KENYAN_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo',
  'Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale',
  'Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru','Migori','Mombasa',
  "Murang'a",'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya',
  'Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga',
  'Wajir','West Pokot',
] as const;
