import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { business } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Staff sign in',
  // Keep the admin door out of search results entirely.
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin/dashboard');

  return (
    <div className="no-tabbar flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink text-lg font-bold text-white">D</span>
          <h1 className="mt-4 text-xl">{business.name}</h1>
          <p className="text-sm text-muted">Staff dashboard</p>
        </div>

        <div className="rounded-3xl bg-surface p-6 shadow-soft"><AdminLoginForm /></div>

        <p className="mt-5 text-center text-xs text-muted">
          Not staff? <Link href="/" className="link">Go to the shop</Link>
        </p>
      </div>
    </div>
  );
}
