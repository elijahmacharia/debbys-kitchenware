import { CheckIcon } from '@/components/icons';
import { STATUS_META, stageLabel, timelineFor, type OrderStatus } from '@/lib/orders';
import { cn } from '@/lib/cn';

/**
 * Order tracking timeline.
 *
 * Only the stages that apply to this order are shown — a pickup order never
 * displays "Out for delivery". A cancelled order shows a single clear state
 * rather than a half-finished progress bar.
 */
export function OrderTimeline({
  status, fulfilment, events,
}: { status: string; fulfilment: string; events: { status: string; createdAt: Date; note: string | null }[] }) {
  if (status === 'CANCELLED') {
    const cancelled = events.find((e) => e.status === 'CANCELLED');
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
        <p className="text-sm font-semibold text-danger">This order was cancelled</p>
        {cancelled?.note ? <p className="mt-1 text-sm text-muted">{cancelled.note}</p> : null}
        <p className="mt-1 text-xs text-muted">If you did not expect this, please contact us and we will look into it.</p>
      </div>
    );
  }

  const stages = timelineFor(fulfilment);
  const currentIndex = stages.indexOf(status as OrderStatus);
  const reachedAt = new Map(events.map((event) => [event.status, event.createdAt]));

  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => {
        const done = index <= currentIndex;
        const timestamp = reachedAt.get(stage);

        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold',
                  done ? 'border-clay-600 bg-ink text-white' : 'border-line bg-surface text-subtle')}
                aria-hidden="true"
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {index < stages.length - 1 ? (
                <span className={cn('w-0.5 flex-1', index < currentIndex ? 'bg-clay-600' : 'bg-line')} />
              ) : null}
            </div>

            <div className={cn('pb-5', index === stages.length - 1 && 'pb-0')}>
              <p className={cn('text-sm font-semibold', done ? 'text-ink' : 'text-subtle')}>
                {stageLabel(stage, fulfilment)}
                {index === currentIndex ? <span className="badge ml-2 bg-clay-100 text-ink">Current</span> : null}
              </p>
              <p className="text-xs text-muted">{done ? STATUS_META[stage].customerText : 'Not yet'}</p>
              {timestamp ? (
                <p className="mt-0.5 text-[11px] text-subtle">
                  {new Date(timestamp).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
