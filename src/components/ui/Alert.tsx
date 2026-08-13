import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon, CheckIcon, InfoIcon } from '@/components/icons';

type Tone = 'info' | 'success' | 'warning' | 'error';

const TONE: Record<Tone, { wrap: string; Icon: typeof InfoIcon }> = {
  info: { wrap: 'border-clay-200 bg-clay-50 text-ink', Icon: InfoIcon },
  success: { wrap: 'border-clay-300 bg-clay-50 text-ink', Icon: CheckIcon },
  warning: { wrap: 'border-clay-200 bg-clay-50 text-clay-700', Icon: AlertIcon },
  error: { wrap: 'border-danger/30 bg-danger/5 text-danger', Icon: AlertIcon },
};

export function Alert({
  tone = 'info', title, children, className,
}: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  const { wrap, Icon } = TONE[tone];
  return (
    <div
      // role="alert" makes screen readers announce errors as they appear.
      role={tone === 'error' ? 'alert' : undefined}
      className={cn('flex gap-2.5 rounded-card border p-3 text-sm', wrap, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div> : null}
      </div>
    </div>
  );
}
