import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCustomerSession } from '@/lib/auth';
import { AuthCard } from '@/components/account/AuthCard';
import { LoginForm } from '@/components/account/LoginForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { GoogleButton } from '@/components/account/GoogleButton';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to view your orders, saved addresses and wishlist.',
  robots: { index: false, follow: true },
};

export default async function LoginPage() {
  // Already signed in? There is nothing to do here.
  if (await getCustomerSession()) redirect('/account');

  return (
    <AuthCard
      title="Sign in"
      subtitle="Orders, addresses and wishlist."
      footer={<>New here? <Link href="/register" className="link">Create an account</Link></>}
    >
      <GoogleButton label="Continue with Google" />

      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
