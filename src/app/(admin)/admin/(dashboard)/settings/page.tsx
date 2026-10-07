import type { Metadata } from 'next';
import { EDITABLE_SETTINGS, getSettings, getShopProfile } from '@/lib/settings';
import { business, isPlaceholder, paymentMethodsFor, siteUrl } from '@/lib/config';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } };

/**
 * Phone, address, hours, M-Pesa details, and shop copy. Saved rows live in
 * the database and show on the shop immediately. Secrets stay out of this form.
 */
export default async function AdminSettingsPage() {
  const [values, profile] = await Promise.all([getSettings(), getShopProfile()]);
  const formValues: Record<string, string> = { ...values };
  const prefill: Record<string, string> = {
    'business.phone': profile.phone,
    'business.whatsapp': profile.whatsapp,
    'business.email': profile.email,
    'business.address': profile.address,
    'business.city': profile.city,
    'business.county': profile.county,
    'business.hours': profile.hours,
    'business.mapsUrl': profile.mapsUrl,
    'business.mapsEmbedUrl': profile.mapsEmbedUrl,
    'payment.mpesaTill': profile.till,
    'payment.mpesaPaybill': profile.paybill,
    'payment.mpesaPaybillAccount': profile.paybillAccount,
    'payment.sendMoneyName': profile.sendMoneyName,
  };
  for (const [key, current] of Object.entries(prefill)) {
    if (!(key in formValues) && !isPlaceholder(current)) formValues[key] = current;
  }

  const envRows = [
    { label: 'Business name', value: business.name, key: 'name' },
    { label: 'Phone', value: profile.phone, key: 'phone' },
    { label: 'WhatsApp number', value: profile.whatsapp, key: 'whatsapp' },
    { label: 'Email', value: profile.email, key: 'email' },
    { label: 'Shop address', value: profile.address, key: 'address' },
    { label: 'Opening hours', value: profile.hours, key: 'hours' },
    { label: 'Google Maps link', value: profile.mapsUrl || '(not set)', key: 'maps' },
    { label: 'M-Pesa Till', value: profile.till || '(not set)', key: 'till' },
    { label: 'Website address', value: siteUrl, key: 'site' },
  ];

  const missing = envRows.filter((row) => isPlaceholder(row.value));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted">Phone, address, hours, M-Pesa and the wording on the shop. Saving updates the site straight away.</p>

      {missing.length > 0 ? (
        <Alert tone="warning" className="mt-4" title={`${missing.length} business detail${missing.length === 1 ? '' : 's'} still missing`}>
          These are still missing, so customers do not see them. Type them in Business details below
          and press Save settings. They appear on the shop straight away.
        </Alert>
      ) : null}

      <section className="admin-panel mt-5" aria-labelledby="env-settings">
        <h2 id="env-settings" className="px-5 pb-3 pt-5 text-sm font-semibold">What customers see now</h2>
        <dl className="divide-y divide-line text-sm">
          {envRows.map((row) => (
            <div key={row.key} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
              <dt className="text-muted">{row.label}</dt>
              <dd className={isPlaceholder(row.value) ? 'font-mono text-xs text-danger' : 'text-right font-medium text-ink'}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line bg-canvas px-4 py-3 text-xs text-muted">
          What you save under Business details replaces this list. Leave a box blank to keep the value already shown.
        </p>
      </section>

      <section className="admin-panel mt-4" aria-labelledby="payment-settings">
        <h2 id="payment-settings" className="px-5 pb-3 pt-5 text-sm font-semibold">Payment methods offered</h2>
        <ul className="divide-y divide-line text-sm">
          {paymentMethodsFor(profile).map((method) => (
            <li key={method.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-ink">{method.label}</span>
              <span className={method.enabled ? 'text-xs font-semibold text-success' : 'text-xs text-subtle'}>
                {method.enabled ? 'Offered' : 'Not configured'}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line bg-canvas px-4 py-3 text-xs text-muted">
          Type an M-Pesa Till or Paybill under Business details to show the matching instructions at checkout.
          Customers still pay in their M-Pesa app and send you the confirmation message.
        </p>
      </section>

      <h2 className="mt-8 text-base font-bold">Text you can edit</h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        These are saved in the database and take effect immediately. Leaving a policy blank shows the
        built-in draft with its &ldquo;needs review&rdquo; notice.
      </p>
      <SettingsForm definitions={[...EDITABLE_SETTINGS]} values={formValues} />
    </div>
  );
}
