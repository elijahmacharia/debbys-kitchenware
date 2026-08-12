'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { EditIcon, MapPinIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { KENYAN_COUNTIES } from '@/lib/config';
import type { SavedAddress } from '@/components/cart/CheckoutForm';

const EMPTY = {
  label: 'Home', recipientName: '', phone: '', county: 'Nairobi', town: '',
  area: '', estate: '', building: '', landmark: '', directions: '', isDefault: false,
};

/**
 * Saved delivery addresses.
 *
 * Built around estate and landmark rather than street number, because that is
 * how most deliveries in Kenya are actually found. Only county, town and area
 * are required.
 */
export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(addresses.length === 0);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: '' }));
  };

  const startCreate = () => {
    setForm({ ...EMPTY, isDefault: addresses.length === 0 });
    setEditing(null);
    setCreating(true);
    setErrors({});
    setError(null);
  };

  const startEdit = (address: SavedAddress) => {
    setForm({
      label: address.label, recipientName: address.recipientName, phone: address.phone,
      county: address.county, town: address.town, area: address.area,
      estate: address.estate ?? '', building: address.building ?? '',
      landmark: address.landmark ?? '', directions: address.directions ?? '',
      isDefault: address.isDefault,
    });
    setEditing(address.id);
    setCreating(false);
    setErrors({});
    setError(null);
  };

  const cancel = () => { setCreating(false); setEditing(null); setErrors({}); setError(null); };

  const validate = () => {
    const problems: Record<string, string> = {};
    if (form.recipientName.trim().length < 2) problems.recipientName = 'Who should we ask for on arrival?';
    if (!/^(\+?254|0)?[71]\d{8}$/.test(form.phone.replace(/[\s()-]/g, ''))) problems.phone = 'Enter a valid Kenyan phone number';
    if (!form.town.trim()) problems.town = 'Town is required';
    if (!form.area.trim()) problems.area = 'Area is required';
    setErrors(problems);
    return Object.keys(problems).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(editing ? `/api/account/addresses/${editing}` : '/api/account/addresses', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setError(data.error ?? 'We could not save this address.');
        return;
      }
      cancel();
      router.refresh();
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address: SavedAddress) => {
    if (!window.confirm(`Delete the address "${address.label}"?`)) return;
    setDeletingId(address.id);
    try {
      const response = await fetch(`/api/account/addresses/${address.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError('We could not delete that address. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const showForm = creating || editing !== null;

  return (
    <div className="space-y-4">
      {error && !showForm ? <Alert tone="error">{error}</Alert> : null}

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={<MapPinIcon className="h-8 w-8" />}
          title="No saved addresses yet"
          description="Save a place and your next order is a few taps."
          action={<Button onClick={startCreate}><PlusIcon className="h-4 w-4" />Add an address</Button>}
        />
      ) : null}

      {addresses.length > 0 ? (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    {address.label}
                    {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">{address.recipientName} · {address.phone}</p>
                  <p className="mt-1 text-sm text-muted">
                    {[address.area, address.estate, address.town, address.county].filter(Boolean).join(', ')}
                  </p>
                  {address.building ? <p className="text-sm text-muted">{address.building}</p> : null}
                  {address.landmark ? <p className="text-sm text-muted">Landmark: {address.landmark}</p> : null}
                  {address.directions ? <p className="mt-1 text-xs italic text-subtle">“{address.directions}”</p> : null}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => startEdit(address)} className="btn-ghost btn-sm border border-line" aria-label={`Edit ${address.label}`}>
                    <EditIcon className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(address)}
                    disabled={deletingId === address.id}
                    className="btn-ghost btn-sm border border-line text-danger"
                    aria-label={`Delete ${address.label}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deletingId === address.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!showForm && addresses.length > 0 ? (
        <Button variant="secondary" onClick={startCreate}><PlusIcon className="h-4 w-4" />Add another address</Button>
      ) : null}

      {showForm ? (
        <form onSubmit={submit} noValidate className="card space-y-4 p-4 sm:p-5">
          <h2 className="text-base font-bold">{editing ? 'Edit address' : 'New address'}</h2>
          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Label" required value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Home, Work, Mum's place" error={errors.label} />
            <TextField label="Who receives it" required value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} error={errors.recipientName} />
            <TextField label="Phone number" required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0712345678" error={errors.phone} />
            <SelectField label="County" required value={form.county} onChange={(e) => set('county', e.target.value)} error={errors.county}>
              {KENYAN_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
            </SelectField>
            <TextField label="Town" required value={form.town} onChange={(e) => set('town', e.target.value)} error={errors.town} placeholder="e.g. Nairobi" />
            <TextField label="Area" required value={form.area} onChange={(e) => set('area', e.target.value)} error={errors.area} placeholder="e.g. Kasarani" />
            <TextField label="Estate" value={form.estate} onChange={(e) => set('estate', e.target.value)} placeholder="e.g. Mwiki" />
            <TextField label="Building / house" value={form.building} onChange={(e) => set('building', e.target.value)} />
            <div className="sm:col-span-2">
              <TextField label="Nearest landmark" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} placeholder="e.g. Near XYZ School" />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Directions" rows={2} value={form.directions} onChange={(e) => set('directions', e.target.value)} placeholder="e.g. Opposite the supermarket, blue gate." />
            </div>
          </div>

          <CheckboxField label="Make this my default delivery address" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save address'}</Button>
            <Button type="button" variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
