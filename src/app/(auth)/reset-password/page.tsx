import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/account/AuthCard';
import { ResetPasswordForm } from '@/components/account/ResetPasswordForm';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" subtitle="Pick something you have not used elsewhere.">
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
