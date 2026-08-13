'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, clearStoredCart } from './CartProvider';
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ImageIcon, StoreIcon, TruckIcon } from '@/components/icons';
import { formatKsh } from '@/lib/money';
import { KENYAN_COUNTIES } from '@/lib/config';
import { cn } from '@/lib/cn';

export interface CheckoutZone { id: string; name: string; county: string; feeCents: number; etaText: string; note: string | null }
export interface CheckoutPaymentMethod { key: string; label: string; instructions: string; appliesTo: 'both' | 'DELIVERY' | 'PICKUP' }
export interface SavedAddress {
  id: string; label: string; recipientName: string; phone: string; county: string; town: string;
  area: string; estate: string | null; building: string | null; landmark: string | null;
  directions: string | null; isDefault: boolean;
}

type Fulfilment = 'DELIVERY' | 'PICKUP';

export function CheckoutForm({
  zones, paymentMethods, savedAddresses, customer, isSignedIn, deliveryNotice, paymentInstructions, shopAddress,
}: {
  zones: CheckoutZone[];
  paymentMethods: CheckoutPaymentMethod[];
  savedAddresses: SavedAddress[];
  customer: { name: string; phone: string; email: string | null } | null;
  isSignedIn: boolean;
  deliveryNotice: string;
  paymentInstructions: string;
  shopAddress: string | null;
}) {
  const router = useRouter();
  const { lines, subtotalCents, ready, revalidate, clear } = useCart();

  const [fulfilment, setFulfilment] = useState<Fulfilment>(zones.length > 0 ? 'DELIVERY' : 'PICKUP');
  const [form, setForm] = useState({
    customerName: customer?.name ?? '',
    customerPhone: customer?.phone ?? '',
    customerEmail: customer?.email ?? '',
    deliveryZoneId: '',
    county: 'Nairobi',
    town: '',
    area: '',
    estate: '',
    building: '',
    landmark: '',
    directions: '',
    customerNote: '',
    saveAddress: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const applyAddress = (address: SavedAddress) => {
    setForm((current) => ({
      ...current,
      customerName: current.customerName || address.recipientName,
      customerPhone: current.customerPhone || address.phone,
      county: address.county,
      town: address.town,
      area: address.area,
      estate: address.estate ?? '',
      building: address.building ?? '',
      landmark: address.landmark ?? '',
      directions: address.directions ?? '',
    }));
  };

  // Prefill from the customer's default saved address, once on mount.
  useEffect(() => {
    const preferred = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    if (preferred) applyAddress(preferred);
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CHECKOUT_STARTED' }),
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availablePayments = useMemo(
    () => paymentMethods.filter((m) => m.appliesTo === 'both' || m.appliesTo === fulfilment),
    [paymentMethods, fulfilment],
  );

  // Keep the selected payment method valid when the fulfilment type changes.
  useEffect(() => {
    if (!availablePayments.some((m) => m.key === paymentMethod)) {
      setPaymentMethod(availablePayments[0]?.key ?? '');
    }
  }, [availablePayments, paymentMethod]);

  const selectedZone = zones.find((z) => z.id === form.deliveryZoneId) ?? null;
  const deliveryFeeCents = fulfilment === 'DELIVERY' ? selectedZone?.feeCents ?? 0 : 0;
  const totalCents = subtotalCents + deliveryFeeCents;


  /** Mirrors the server rules so obvious mistakes are caught before a request. */
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.customerName.trim().length < 2) next.customerName = 'Please enter your full name';
    if (!/^(\+?254|0)?[71]\d{8}$/.test(form.customerPhone.replace(/[\s()-]/g, ''))) {
      next.customerPhone = 'Enter a valid Kenyan phone number, e.g. 0712345678';
    }
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      next.customerEmail = 'Enter a valid email address, or leave it blank';
    }
    if (fulfilment === 'DELIVERY') {
      if (!form.deliveryZoneId) next.deliveryZoneId = 'Choose the area we should deliver to';
      if (!form.county) next.county = 'County is required';
      if (!form.town.trim()) next.town = 'Town is required';
      if (!form.area.trim()) next.area = 'Area is required';
    }
    if (!paymentMethod) next.paymentMethod = 'Choose how you would like to pay';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Scroll to the first problem so it is not missed on a long form.
      document.getElementById(`field-${Object.keys(next)[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return; // guards against a double tap creating two orders
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      // One last check against live stock before we take the order.
      const problems = await revalidate();
      if (problems.length > 0) {
        setFormError('Your cart changed while you were checking out. Please review it before placing the order.');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          fulfilment,
          paymentMethod,
          deliveryZoneId: fulfilment === 'DELIVERY' ? form.deliveryZoneId : undefined,
          county: fulfilment === 'DELIVERY' ? form.county : undefined,
          town: fulfilment === 'DELIVERY' ? form.town : undefined,
          area: fulfilment === 'DELIVERY' ? form.area : undefined,
          estate: form.estate || undefined,
          building: form.building || undefined,
          landmark: form.landmark || undefined,
          directions: form.directions || undefined,
          customerNote: form.customerNote || undefined,
          saveAddress: isSignedIn && form.saveAddress,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error ?? 'We could not place your order. Please try again.');
        if (Array.isArray(data.unavailable) && data.unavailable.length > 0) await revalidate();
        setSubmitting(false);
        return;
      }

      // Only now, with a confirmed order id from the server, is the cart emptied.
      clear();
      clearStoredCart();
      router.push(data.redirectTo);
    } catch {
      setFormError(
        'We could not reach the server, so your order was NOT placed. Check your connection and try again, or send us your order on WhatsApp.',
      );
      setSubmitting(false);
    }
  };

  if (ready && lines.length === 0) {
    return (
      <Alert tone="info" title="Your cart is empty">
        There is nothing to check out. <Link href="/shop" className="link">Browse the shop</Link> to add some items.
      </Alert>
    );
  }

  const cardClass = 'card p-4 sm:p-5';

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start">
      <div className="space-y-4">
        {formError ? <Alert tone="error" title="Order not placed">{formError}</Alert> : null}

        <section className={cardClass} aria-labelledby="step-contact">
          <h2 id="step-contact" className="text-base font-bold">1. Your details</h2>
          
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div id="field-customerName">
              <TextField label="Full name" required autoComplete="name" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} error={errors.customerName} />
            </div>
            <div id="field-customerPhone">
              <TextField
                label="Phone number" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0712345678"
                value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} error={errors.customerPhone}
                hint="We will WhatsApp you about your order"
              />
            </div>
            <div className="sm:col-span-2" id="field-customerEmail">
              <TextField
                label="Email address" type="email" autoComplete="email"
                value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} error={errors.customerEmail}
                
              />
            </div>
          </div>

          {!isSignedIn ? (
            <p className="mt-3 rounded-control bg-canvas p-2.5 text-xs text-muted">
              Checking out as a guest.{' '}
              <Link href="/login?next=/checkout" className="link">Sign in</Link> to save this order to your account.
            </p>
          ) : null}
        </section>

        <section className={cardClass} aria-labelledby="step-fulfilment">
          <h2 id="step-fulfilment" className="text-base font-bold">2. Pickup or delivery</h2>

          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pickup or delivery">
            <button
              type="button" role="radio" aria-checked={fulfilment === 'PICKUP'} onClick={() => setFulfilment('PICKUP')}
              className={cn('flex items-start gap-3 rounded-card border p-3 text-left transition',
                fulfilment === 'PICKUP' ? 'border-clay-600 bg-clay-50 ring-1 ring-clay-600' : 'border-line hover:border-clay-300')}
            >
              <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay-600" />
              <span>
                <span className="block text-sm font-semibold">Collect at the shop</span>
                <span className="block text-xs text-muted">Free. {shopAddress ?? 'We will confirm where.'}</span>
              </span>
            </button>

            <button
              type="button" role="radio" aria-checked={fulfilment === 'DELIVERY'} disabled={zones.length === 0}
              onClick={() => setFulfilment('DELIVERY')}
              className={cn('flex items-start gap-3 rounded-card border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55',
                fulfilment === 'DELIVERY' ? 'border-clay-600 bg-clay-50 ring-1 ring-clay-600' : 'border-line hover:border-clay-300')}
            >
              <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay-600" />
              <span>
                <span className="block text-sm font-semibold">Deliver to me</span>
                <span className="block text-xs text-muted">
                  {zones.length === 0
                    ? 'No delivery areas set up yet, choose pickup or ask us.'
                    : 'Fee depends on your area.'}
                </span>
              </span>
            </button>
          </div>

          {fulfilment === 'DELIVERY' ? (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              {savedAddresses.length > 0 ? (
                <div>
                  <p className="label">Use a saved address</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => applyAddress(address)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-clay-300 hover:bg-clay-50"
                      >
                        {address.label}, {address.area}{address.isDefault ? ' (default)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div id="field-deliveryZoneId">
                <SelectField
                  label="Delivery area" required value={form.deliveryZoneId}
                  onChange={(e) => set('deliveryZoneId', e.target.value)} error={errors.deliveryZoneId}
                  hint={deliveryNotice || undefined}
                >
                  <option value="">Choose your area…</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}, {zone.feeCents === 0 ? 'fee confirmed on WhatsApp' : formatKsh(zone.feeCents)} · {zone.etaText}
                    </option>
                  ))}
                </SelectField>
                {selectedZone?.note ? <p className="hint">{selectedZone.note}</p> : null}
                {selectedZone && selectedZone.feeCents === 0 ? (
                  <Alert tone="info" className="mt-2">
                    No fixed fee for this area yet. We will confirm the cost before dispatch, the total
                    below does not include it.
                  </Alert>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div id="field-county">
                  <SelectField label="County" required value={form.county} onChange={(e) => set('county', e.target.value)} error={errors.county}>
                    {KENYAN_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
                  </SelectField>
                </div>
                <div id="field-town">
                  <TextField label="Town" required value={form.town} onChange={(e) => set('town', e.target.value)} error={errors.town} placeholder="e.g. Nairobi" />
                </div>
                <div id="field-area">
                  <TextField label="Area" required value={form.area} onChange={(e) => set('area', e.target.value)} error={errors.area} placeholder="e.g. Kasarani" />
                </div>
                <TextField label="Estate" value={form.estate} onChange={(e) => set('estate', e.target.value)} placeholder="e.g. Mwiki" />
                <TextField label="Building / house" value={form.building} onChange={(e) => set('building', e.target.value)} placeholder="e.g. Green Court, House 4" />
                <TextField label="Nearest landmark" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} placeholder="e.g. Near XYZ School" />
              </div>

              <TextAreaField
                label="Directions for the rider" rows={3} value={form.directions}
                onChange={(e) => set('directions', e.target.value)}
                placeholder="e.g. Opposite the supermarket, blue gate on the right."
                hint="Landmarks help more than street names."
              />

              {isSignedIn ? (
                <CheckboxField
                  label="Save this address to my account for next time"
                  checked={form.saveAddress}
                  onChange={(e) => set('saveAddress', e.target.checked)}
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-control bg-canvas p-3 text-sm text-muted">
              <p className="font-medium text-ink">Collect at our shop</p>
              <p className="mt-0.5">{shopAddress ?? 'We will send you the pickup details when we confirm your order.'}</p>
              <p className="mt-1 text-xs">We will let you know as soon as your order is packed and ready.</p>
            </div>
          )}
        </section>

        <section className={cardClass} aria-labelledby="step-payment">
          <h2 id="step-payment" className="text-base font-bold">3. Payment</h2>
          <p className="mt-0.5 text-xs text-muted">
            Nothing is charged here. You pay by the method you choose below.
          </p>

          <div className="mt-3 space-y-2" id="field-paymentMethod" role="radiogroup" aria-label="Payment method">
            {availablePayments.length === 0 ? (
              <Alert tone="warning">
                No payment methods configured yet. Place your order and we will contact you.
              </Alert>
            ) : null}
            {availablePayments.map((method) => (
              <label
                key={method.key}
                className={cn('flex cursor-pointer gap-3 rounded-card border p-3 transition',
                  paymentMethod === method.key ? 'border-clay-600 bg-clay-50 ring-1 ring-clay-600' : 'border-line hover:border-clay-300')}
              >
                <input
                  type="radio" name="paymentMethod" value={method.key} checked={paymentMethod === method.key}
                  onChange={() => { setPaymentMethod(method.key); setErrors((c) => ({ ...c, paymentMethod: '' })); }}
                  className="mt-0.5 h-5 w-5 shrink-0 border-line text-clay-600 focus:ring-clay-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{method.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{method.instructions}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.paymentMethod ? <p className="error-text">{errors.paymentMethod}</p> : null}
          {paymentInstructions ? <p className="mt-3 rounded-control bg-canvas p-2.5 text-xs text-muted">{paymentInstructions}</p> : null}
        </section>

        <section className={cardClass} aria-labelledby="step-notes">
          <h2 id="step-notes" className="text-base font-bold">4. Notes</h2>
          <div className="mt-3">
            <TextAreaField
              label="Anything we should know?" rows={3} value={form.customerNote}
              onChange={(e) => set('customerNote', e.target.value)}
              placeholder="e.g. Please call before delivery."
            />
          </div>
        </section>
      </div>

      <aside className="card sticky top-24 p-4" aria-label="Order summary">
        <h2 className="text-base font-bold">Your order</h2>

        <ul className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-2.5">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-line bg-canvas">
                {line.imageUrl ? (
                  <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-contain p-0.5" />
                ) : (
                  <span className="grid h-full place-items-center text-subtle"><ImageIcon className="h-4 w-4" /></span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-xs font-medium text-ink">{line.name}</span>
                <span className="text-xs text-muted">{line.quantity} × {formatKsh(line.unitPriceCents)}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold">{formatKsh(line.unitPriceCents * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatKsh(subtotalCents)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted">{fulfilment === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
            <dd className="font-semibold">
              {fulfilment === 'PICKUP'
                ? 'Free'
                : !selectedZone
                  ? <span className="text-xs font-normal text-muted">Choose an area</span>
                  : selectedZone.feeCents === 0
                    ? <span className="text-xs font-normal text-muted">To be confirmed</span>
                    : formatKsh(selectedZone.feeCents)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base">
            <dt className="font-semibold">Total</dt><dd className="font-bold">{formatKsh(totalCents)}</dd>
          </div>
        </dl>

        <Button type="submit" fullWidth loading={submitting} className="mt-4">
          {submitting ? 'Placing your order…' : 'Place order'}
        </Button>

        <p className="mt-2 text-center text-xs text-muted">
          You will get an order number next, and a WhatsApp button to reach us.
        </p>

      </aside>
    </form>
  );
}
