import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/account/AuthCard';
import { ForgotPasswordForm } from '@/components/account/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Forgot your password', robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password"
      subtitle="Enter your phone or email and we will send a reset link."
      footer={<Link href="/login" className="link">Back to sign in</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
