import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCustomerSession } from '@/lib/auth';
import { AuthCard } from '@/components/account/AuthCard';
import { RegisterForm } from '@/components/account/RegisterForm';
import { Skeleton } from '@/components/ui/Skeleton';

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
      subtitle="Optional — it saves your orders, addresses and wishlist for next time."
      footer={<>Already have an account? <Link href="/login" className="link">Sign in</Link></>}
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
