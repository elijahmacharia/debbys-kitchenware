'use client';

import { useState } from 'react';
import { AdminForm } from './AdminForm';
import { ActionButton } from './ActionButton';
import { TextField, TextAreaField, CheckboxField } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { centsToInput, formatKsh } from '@/lib/money';
import { deleteDeliveryZoneAction, saveDeliveryZoneAction } from '@/app/(admin)/admin/actions';

export interface AdminZone {
  id: string; name: string; county: string; feeCents: number;
  etaText: string; note: string | null; isActive: boolean; sortOrder: number;
}

export function DeliveryZoneManager({ zones }: { zones: AdminZone[] }) {
  const [editing, setEditing] = useState<AdminZone | null>(null);
  const [creating, setCreating] = useState(false);
  const close = () => { setEditing(null); setCreating(false); };

  const inactiveCount = zones.filter((z) => !z.isActive).length;

  const form = (zone: AdminZone | null) => (
    <AdminForm
      action={(data) => saveDeliveryZoneAction(zone?.id ?? null, data)}
      submitLabel={zone ? 'Save changes' : 'Create zone'}
      onSuccess={close}
      className="mt-5 rounded-3xl bg-surface p-5 shadow-soft sm:p-6"
      secondary={<Button type="button" variant="secondary" onClick={close}>Cancel</Button>}
    >
      {(errors) => (
        <div className="space-y-4">
          <h2 className="text-base font-bold">{zone ? `Edit ${zone.name}` : 'New delivery zone'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Area name" required defaultValue={zone?.name} error={errors.name} placeholder="e.g. Kasarani" />
            <TextField name="county" label="County" required defaultValue={zone?.county ?? 'Nairobi'} error={errors.county} />
            <TextField
              name="fee" label="Delivery fee (KSh)" required inputMode="decimal"
              defaultValue={zone ? centsToInput(zone.feeCents) : ''} error={errors.feeCents}
              placeholder="150"
              hint="Enter 0 to tell customers the fee will be confirmed on WhatsApp."
            />
            <TextField name="etaText" label="Estimated time" defaultValue={zone?.etaText ?? '1-2 days'} error={errors.etaText} placeholder="Same day" />
            <TextField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={zone?.sortOrder ?? 0} error={errors.sortOrder} hint="Lower numbers appear first." />
          </div>
          <TextAreaField name="note" label="Note for customers" rows={2} defaultValue={zone?.note ?? ''} error={errors.note} placeholder="e.g. Deliveries to this area go out in the afternoon." />
          <CheckboxField
            name="isActive" label="Offer this area at checkout" defaultChecked={zone?.isActive ?? false}
            hint="Leave off until you are happy with the fee. Customers only see active zones."
          />
        </div>
      )}
    </AdminForm>
  );

  return (
    <div>
      {inactiveCount > 0 ? (
        <Alert tone="warning" className="mb-4" title={`${inactiveCount} zone${inactiveCount === 1 ? ' is' : 's are'} switched off`}>
          Zones start switched off with a zero fee, because only you can decide what delivery to each area
          should cost. Set the fee and tick &ldquo;Offer this area at checkout&rdquo; to make it available.
        </Alert>
      ) : null}

      {zones.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Delivery zones with fees and availability</caption>
            <thead className="text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Area</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">County</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Fee</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Time</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {zones.map((zone) => (
                <tr key={zone.id} className={zone.isActive ? undefined : 'opacity-60'}>
                  <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">{zone.name}</th>
                  <td className="px-3 py-2.5 text-muted">{zone.county}</td>
                  <td className="px-3 py-2.5">
                    {zone.feeCents === 0 ? <span className="text-xs text-muted">Confirmed with customer</span> : <span className="font-semibold">{formatKsh(zone.feeCents)}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{zone.etaText}</td>
                  <td className="px-3 py-2.5">
                    {zone.isActive ? <Badge tone="success">Offered</Badge> : <Badge tone="neutral">Off</Badge>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => { setEditing(zone); setCreating(false); }} className="btn-secondary btn-sm">Edit</button>
                      <ActionButton
                        variant="ghost"
                        className="text-danger"
                        action={async () => deleteDeliveryZoneAction(zone.id)}
                        confirmMessage={`Delete the zone "${zone.name}"? Existing orders keep the area name they were placed with.`}
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface shadow-soft p-8 text-center text-sm text-muted">
          No delivery zones yet. Add one to start offering delivery.
        </p>
      )}

      {!creating && !editing ? (
        <Button className="mt-4" variant="secondary" onClick={() => setCreating(true)}>
          <PlusIcon className="h-4 w-4" /> Add a delivery zone
        </Button>
      ) : null}

      {creating ? form(null) : null}
      {editing ? form(editing) : null}
    </div>
  );
}
