import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCustomerSession } from '@/lib/auth';
import { AuthCard } from '@/components/account/AuthCard';
import { RegisterForm } from '@/components/account/RegisterForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { GoogleButton } from '@/components/account/GoogleButton';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create an optional account to track your orders, save addresses and keep a wishlist.',
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  if (await getCustomerSession()) redirect('/account');

  return (
    <AuthCard
      title="Create an account"
      subtitle="Optional. Saves your orders, addresses and wishlist."
      footer={<>Already have an account? <Link href="/login" className="link">Sign in</Link></>}
    >
      <GoogleButton label="Sign up with Google" />

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
