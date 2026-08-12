import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';

/** /admin is a doorway: signed in goes to the dashboard, otherwise to login. */
export default async function AdminIndexPage() {
  const session = await getAdminSession();
  redirect(session ? '/admin/dashboard' : '/admin/login');
}
