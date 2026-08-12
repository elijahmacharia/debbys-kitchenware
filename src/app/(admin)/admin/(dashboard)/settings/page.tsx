import type { Metadata } from 'next';
import { EDITABLE_SETTINGS, getSettings } from '@/lib/settings';
import { business, isPlaceholder, paymentMethods, siteUrl } from '@/lib/config';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } };

/**
 * Two kinds of setting, and the difference matters:
 *  - Editable here: copy and policies, stored in the database, changed with no
 *    developer involvement.
 *  - Environment variables: the business identity (phone, WhatsApp, address)
 *    and anything secret. These are read-only here on purpose — showing a
 *    secret in a web form is how secrets leak.
 */
export default async function AdminSettingsPage() {
  const values = await getSettings();

  const envRows = [
    { label: 'Business name', value: business.name, key: 'NEXT_PUBLIC_BUSINESS_NAME' },
    { label: 'Phone', value: business.phone, key: 'NEXT_PUBLIC_BUSINESS_PHONE' },
    { label: 'WhatsApp number', value: business.whatsapp, key: 'NEXT_PUBLIC_BUSINESS_WHATSAPP' },
    { label: 'Email', value: business.email, key: 'NEXT_PUBLIC_BUSINESS_EMAIL' },
    { label: 'Shop address', value: business.address, key: 'NEXT_PUBLIC_BUSINESS_ADDRESS' },
    { label: 'Opening hours', value: business.hours, key: 'NEXT_PUBLIC_BUSINESS_HOURS' },
    { label: 'Google Maps link', value: business.mapsUrl || '(not set)', key: 'NEXT_PUBLIC_GOOGLE_MAPS_URL' },
    { label: 'Website address', value: siteUrl, key: 'NEXT_PUBLIC_SITE_URL' },
  ];

  const missing = envRows.filter((row) => isPlaceholder(row.value));

  return (
    <div className="max-w-3xl">
      <h1>Settings</h1>
      <p className="mt-1 text-sm text-muted">Text and policies you can change yourself, plus the details that live in configuration.</p>

      {missing.length > 0 ? (
        <Alert tone="warning" className="mt-4" title={`${missing.length} business detail${missing.length === 1 ? '' : 's'} still missing`}>
          These are placeholders and are hidden from customers until they are filled in. Ask your
          developer to set them in the <code>.env</code> file: {missing.map((m) => m.key).join(', ')}.
        </Alert>
      ) : null}

      <section className="card mt-5 overflow-hidden" aria-labelledby="env-settings">
        <h2 id="env-settings" className="border-b border-line px-4 py-3 text-sm font-bold">Business details (set in configuration)</h2>
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
          These are read-only here on purpose. They are set once in the <code>.env</code> file at deploy
          time, which keeps secrets out of the browser entirely.
        </p>
      </section>

      <section className="card mt-4 overflow-hidden" aria-labelledby="payment-settings">
        <h2 id="payment-settings" className="border-b border-line px-4 py-3 text-sm font-bold">Payment methods offered</h2>
        <ul className="divide-y divide-line text-sm">
          {paymentMethods.map((method) => (
            <li key={method.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-ink">{method.label}</span>
              <span className={method.enabled ? 'text-xs font-semibold text-success' : 'text-xs text-subtle'}>
                {method.enabled ? 'Offered' : 'Not configured'}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line bg-canvas px-4 py-3 text-xs text-muted">
          Turn a method on by setting its value in <code>.env</code>, for example{' '}
          <code>NEXT_PUBLIC_MPESA_TILL</code>. Automated M-Pesa (STK push) is not implemented.
        </p>
      </section>

      <h2 className="mt-8 text-base font-bold">Text you can edit</h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        These are saved in the database and take effect immediately. Leaving a policy blank shows the
        built-in draft with its &ldquo;needs review&rdquo; notice.
      </p>
      <SettingsForm definitions={[...EDITABLE_SETTINGS]} values={values} />
    </div>
  );
}
