import type { Metadata } from 'next';
import { getCurrentCustomer } from '@/lib/auth';
import { ProfileForm } from '@/components/account/ProfileForm';
import { PasswordForm } from '@/components/account/PasswordForm';

export const metadata: Metadata = { title: 'Profile', robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1>Profile</h1>
        <p className="mt-1 text-sm text-muted">Keep these current so we can reach you.</p>
      </div>
      <ProfileForm customer={{ name: customer.name, phone: customer.phone, email: customer.email }} />
      <PasswordForm />
    </div>
  );
}
