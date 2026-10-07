import 'server-only';
import { cache } from 'react';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { business, isPlaceholder, type PaymentDetails } from '@/lib/config';

/**
 * Settings the owner can edit in the admin dashboard. Environment variables
 * supply the defaults at deploy time; a row here overrides them at runtime so
 * copy changes do not need a redeploy.
 */

export const EDITABLE_SETTINGS = [
  { key: 'business.phone', label: 'Phone number customers can call', group: 'Business details' },
  { key: 'business.whatsapp', label: 'WhatsApp number, digits only, starting with 254', group: 'Business details' },
  { key: 'business.email', label: 'Email address', group: 'Business details' },
  { key: 'business.address', label: 'Shop address', group: 'Business details' },
  { key: 'business.city', label: 'Town or city', group: 'Business details' },
  { key: 'business.county', label: 'County', group: 'Business details' },
  { key: 'business.hours', label: 'Opening hours', group: 'Business details' },
  { key: 'business.mapsUrl', label: 'Google Maps share link', group: 'Business details' },
  { key: 'business.mapsEmbedUrl', label: 'Google Maps embed link (optional)', group: 'Business details' },
  { key: 'payment.mpesaTill', label: 'M-Pesa Till number (Buy Goods)', group: 'Business details' },
  { key: 'payment.mpesaPaybill', label: 'M-Pesa Paybill number (leave blank to hide Paybill)', group: 'Business details' },
  { key: 'payment.mpesaPaybillAccount', label: 'Paybill account number', group: 'Business details' },
  { key: 'payment.sendMoneyName', label: 'Name for M-Pesa Send Money (leave blank to hide it)', group: 'Business details' },
  { key: 'shop.announcement', label: 'Announcement bar text (blank hides the bar)', group: 'Shop' },
  { key: 'delivery.notice', label: 'Delivery notice shown at checkout', group: 'Delivery', multiline: true },
  { key: 'payment.instructions', label: 'Extra payment instructions', group: 'Payment', multiline: true },
  { key: 'policy.returns', label: 'Returns policy', group: 'Policies', multiline: true },
  { key: 'policy.privacy', label: 'Privacy policy', group: 'Policies', multiline: true },
  { key: 'policy.terms', label: 'Terms and conditions', group: 'Policies', multiline: true },
  { key: 'about.extra', label: 'Extra paragraph for the About page', group: 'Content', multiline: true },
] as const;

export type EditableSetting = { key: string; label: string; group: string; multiline?: boolean };

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

const prefer = (saved: string | undefined, fallback: string): string => {
  const value = saved?.trim() ?? '';
  return value || fallback;
};

export interface ShopProfile extends PaymentDetails {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  county: string;
  hours: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
}

/** Address line customers see, skipping blanks and dropping a town already written in the street. */
export function formatShopPlace(profile: Pick<ShopProfile, 'address' | 'city' | 'county'>): string | null {
  const parts = [profile.address, profile.city, profile.county].filter((part) => !isPlaceholder(part));
  const unique: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (unique.some((existing) => existing.toLowerCase().includes(lower))) continue;
    unique.push(part);
  }
  return unique.length > 0 ? unique.join(', ') : null;
}

/** Google Maps embed URLs only. Anything else is ignored so the map frame cannot load an arbitrary site. */
export function mapsEmbedSrc(url: string): string | null {
  if (isPlaceholder(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    const google = host === 'www.google.com' || host === 'maps.google.com' || host.endsWith('.google.com') || host.endsWith('.google.co.ke');
    if (!google) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** What customers see. A value saved in Settings wins over the deploy-time default. */
export const getShopProfile = cache(async (): Promise<ShopProfile> => {
  const saved = await getSettings();
  return {
    name: business.name,
    phone: prefer(saved['business.phone'], business.phone),
    whatsapp: prefer(saved['business.whatsapp'], business.whatsapp),
    email: prefer(saved['business.email'], business.email),
    address: prefer(saved['business.address'], business.address),
    city: prefer(saved['business.city'], business.city),
    county: prefer(saved['business.county'], business.county),
    hours: prefer(saved['business.hours'], business.hours),
    mapsUrl: prefer(saved['business.mapsUrl'], business.mapsUrl),
    mapsEmbedUrl: prefer(saved['business.mapsEmbedUrl'], business.mapsEmbedUrl),
    till: prefer(saved['payment.mpesaTill'], process.env.NEXT_PUBLIC_MPESA_TILL ?? ''),
    paybill: prefer(saved['payment.mpesaPaybill'], process.env.NEXT_PUBLIC_MPESA_PAYBILL ?? ''),
    paybillAccount: prefer(saved['payment.mpesaPaybillAccount'], process.env.NEXT_PUBLIC_MPESA_PAYBILL_ACCOUNT ?? ''),
    sendMoneyName: prefer(saved['payment.sendMoneyName'], process.env.NEXT_PUBLIC_MPESA_SEND_MONEY_NAME ?? ''),
  };
});


/**
 * Only keys declared in EDITABLE_SETTINGS are written. Without this filter a
 * crafted form post could create arbitrary rows in the settings table.
 */
export async function saveSettings(values: Record<string, string>) {
  const allowed = new Set<string>(EDITABLE_SETTINGS.map((s) => s.key));
  const entries = Object.entries(values).filter(([key]) => allowed.has(key));
  if (entries.length === 0) return;
  await db.transaction(async (tx) => {
    for (const [key, value] of entries) {
      await tx
        .insert(settings)
        .values({ key, value: value.slice(0, 5000) })
        .onConflictDoUpdate({ target: settings.key, set: { value: value.slice(0, 5000) } });
    }
  });
}

/** Settings a browser is allowed to see. Used by the public site. */
export async function getPublicSettings() {
  const all = await getSettings();
  return {
    announcement: all['shop.announcement'] ?? '',
    deliveryNotice: all['delivery.notice'] ?? '',
    paymentInstructions: all['payment.instructions'] ?? '',
    returnsPolicy: all['policy.returns'] ?? '',
    privacyPolicy: all['policy.privacy'] ?? '',
    termsPolicy: all['policy.terms'] ?? '',
    aboutExtra: all['about.extra'] ?? '',
  };
}
