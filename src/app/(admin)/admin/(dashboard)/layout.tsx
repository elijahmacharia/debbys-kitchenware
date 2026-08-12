import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

/**
 * Guards every dashboard route.
 *
 * getCurrentAdmin re-reads the staff record on each request, so disabling an
 * account takes effect immediately rather than whenever their token happens to
 * expire. This is the convenience gate — every server action re-checks
 * independently, because a layout cannot protect data.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return <AdminShell adminName={admin.name} role={admin.role}>{children}</AdminShell>;
}
