import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SpinnerIcon } from '@/components/icons';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'whatsapp';

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  whatsapp: 'btn-whatsapp',
};

interface Common {
  variant?: Variant;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary', size = 'md', fullWidth, loading, className, children, disabled, ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      // A loading button is also disabled: this is what stops a customer
      // double-tapping "Place order" and creating two orders.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(VARIANT[variant], size === 'sm' && 'btn-sm', fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <SpinnerIcon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary', size = 'md', fullWidth, className, children, href, external, ...props
}: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }) {
  const classes = cn(VARIANT[variant], size === 'sm' && 'btn-sm', fullWidth && 'w-full', className);

  if (external) {
    // noopener/noreferrer on every external link: without it the opened page
    // can reach back through window.opener.
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>{children}</a>
    );
  }
  return <Link href={href} className={classes} {...props}>{children}</Link>;
}
