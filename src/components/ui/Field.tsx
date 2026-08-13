'use client';

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon } from '@/components/icons';

/**
 * Form controls with the label, hint and error wired together properly.
 *
 * The error is linked with aria-describedby and aria-invalid rather than only
 * being coloured red, so a screen reader announces it and the form is still
 * usable by someone who cannot distinguish the colour.
 */

interface FieldShell {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Renders the label for screen readers only — for compact toolbars. */
  hideLabel?: boolean;
}

function Shell({ id, label, hint, error, required, hideLabel, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={cn('label', hideLabel && 'sr-only')}>
        {label}
        {required
          ? <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
          : <span className="ml-1 text-xs font-normal text-subtle">(optional)</span>}
      </label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="hint">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="error-text" role="alert">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label, hint, error, required, className, hideLabel, ...props
}: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn('input', error && 'input-error', className)}
        {...props}
      />
    </Shell>
  );
}

export function TextAreaField({
  label, hint, error, required, className, hideLabel, ...props
}: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <textarea
        id={id}
        rows={4}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn('input py-2.5', error && 'input-error', className)}
        {...props}
      />
    </Shell>
  );
}

export function SelectField({
  label, hint, error, required, className, hideLabel, children, ...props
}: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn('input appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9', error && 'input-error', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23586659' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m5 9 7 7 7-7'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </Shell>
  );
}

export function CheckboxField({
  label, hint, error, ...props
}: { label: ReactNode; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-clay-600 focus:ring-clay-600"
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-6 text-ink">{label}</label>
      </div>
      {hint ? <p id={`${id}-hint`} className="hint ml-7">{hint}</p> : null}
      {error ? <p className="error-text ml-7" role="alert">{error}</p> : null}
    </div>
  );
}
