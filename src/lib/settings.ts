import 'server-only';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * Settings the owner can edit in the admin dashboard. Environment variables
 * supply the defaults at deploy time; a row here overrides them at runtime so
 * copy changes do not need a redeploy.
 */

export const EDITABLE_SETTINGS = [
  { key: 'shop.announcement', label: 'Announcement bar text (blank hides the bar)', group: 'Shop' },
  { key: 'delivery.notice', label: 'Delivery notice shown at checkout', group: 'Delivery', multiline: true },
  { key: 'payment.instructions', label: 'Extra payment instructions', group: 'Payment', multiline: true },
  { key: 'policy.returns', label: 'Returns policy', group: 'Policies', multiline: true },
  { key: 'policy.privacy', label: 'Privacy policy', group: 'Policies', multiline: true },
  { key: 'policy.terms', label: 'Terms and conditions', group: 'Policies', multiline: true },
  { key: 'about.extra', label: 'Extra paragraph for the About page', group: 'Content', multiline: true },
] as const;

export type EditableSetting = { key: string; label: string; group: string; multiline?: boolean };

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

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
