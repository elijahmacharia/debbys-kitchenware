'use client';

import { AdminForm } from './AdminForm';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { STATUS_META, type OrderStatus } from '@/lib/orders';
import { saveOrderNoteAction, updateOrderPaymentAction, updateOrderStatusAction } from '@/app/(admin)/admin/actions';
import { MarkPaidPanel } from './MarkPaidButton';

/**
 * The three things staff actually do to an order: move it along, record that
 * payment arrived, and leave a note for themselves.
 */
export function OrderControls({
  orderId, currentStatus, allowedStatuses, paymentStatus, paymentMethod, paymentReference, adminNote,
}: {
  orderId: string;
  currentStatus: string;
  allowedStatuses: OrderStatus[];
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string | null;
  adminNote: string | null;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <h2 className="text-sm font-bold">Update status</h2>
        {allowedStatuses.length === 0 ? (
          <Alert tone="info" className="mt-2">
            This order is {currentStatus === 'DELIVERED' ? 'complete' : 'cancelled'}, so its status can no
            longer be changed.
          </Alert>
        ) : (
          <AdminForm action={(form) => updateOrderStatusAction(orderId, form)} submitLabel="Update status" className="mt-3">
            {(errors) => (
              <div className="space-y-3">
                <SelectField name="status" label="New status" required error={errors.status}>
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}{status === 'CANCELLED' ? ' (returns stock)' : ''}
                    </option>
                  ))}
                </SelectField>
                <TextAreaField
                  name="note" label="Note" rows={2} error={errors.note}
                  hint="Shown to the customer on their tracking timeline. Useful when cancelling."
                />
              </div>
            )}
          </AdminForm>
        )}
      </section>

      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <h2 className="text-sm font-bold">Payment</h2>
        <p className="mt-1 text-xs text-muted">
          Only mark an order paid once you have actually seen the money arrive. The website never sets
          this by itself.
        </p>

        {/* The common case gets its own button. The form below stays for
            corrections: refunds, failed payments, marking something back to
            unpaid. Most days the owner will never need to open it. */}
        {paymentStatus === 'PAID' ? null : (
          <div className="mt-3">
            <MarkPaidPanel orderId={orderId} method={paymentMethod} />
          </div>
        )}

        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-xs font-semibold text-muted hover:text-ink">
            {paymentStatus === 'PAID' ? 'Change payment status' : 'Something else (refund, failed payment)'}
          </summary>
        <AdminForm action={(form) => updateOrderPaymentAction(orderId, form)} submitLabel="Save payment" className="mt-3">
          {(errors) => (
            <div className="space-y-3">
              <SelectField name="paymentStatus" label="Payment status" required defaultValue={paymentStatus} error={errors.paymentStatus}>
                <option value="PENDING">Awaiting payment</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Payment failed</option>
              </SelectField>
              <TextField
                name="paymentReference" label="M-Pesa code" defaultValue={paymentReference ?? ''} error={errors.paymentReference}
                placeholder="e.g. SLK7XQ2M1P" hint="The transaction code from the customer's confirmation message."
              />
            </div>
          )}
        </AdminForm>
        </details>
      </section>

      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <h2 className="text-sm font-bold">Internal note</h2>
        <p className="mt-1 text-xs text-muted">Staff only. The customer never sees this.</p>
        <AdminForm action={(form) => saveOrderNoteAction(orderId, form)} submitLabel="Save note" className="mt-3">
          {(errors) => (
            <TextAreaField name="adminNote" label="Note" hideLabel rows={3} defaultValue={adminNote ?? ''} error={errors.adminNote} placeholder="e.g. Customer asked us to call before 6pm." />
          )}
        </AdminForm>
      </section>
    </div>
  );
}
