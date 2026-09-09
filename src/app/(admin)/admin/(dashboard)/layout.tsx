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

/**
 * Never prerender anything under /admin.
 *
 * Route segment config set on a layout applies to every segment beneath it, so
 * this one line covers the whole dashboard.
 *
 * Two reasons, and the second one broke a deployment:
 *
 * 1. Correctness. These pages show live orders, stock and takings. A page
 *    built once at deploy time and then served from cache would show whatever
 *    the figures were when the site was last deployed — quietly wrong, in the
 *    one place where being wrong matters most.
 *
 * 2. It made the build fail. The dashboard fires 13 queries to build its
 *    summary. Against a local SQLite file that finished instantly and Next
 *    happily prerendered the page. Against a hosted database each query is a
 *    network round trip, the page exceeded Next's 60-second prerender limit,
 *    and `next build` exited 1 with "took more than 60 seconds".
 *
 * The layout reads cookies, which makes the layout itself dynamic, but Next
 * analyses each page separately — so the pages underneath were still being
 * treated as static. Hence the explicit declaration.
 */
export const dynamic = 'force-dynamic';

/**
 * The dashboard summary is 13 queries, and it is the page staff land on
 * immediately after signing in. On a warm database that is a couple of seconds;
 * on a cold start against a database that has been idle it is the request most
 * likely to run out of time and return a 504.
 *
 * Same reasoning as the sign-in route: this is headroom for the slow first
 * request, not a substitute for making the page faster. The real work is
 * reducing the query count.
 */
export const maxDuration = 30;

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return <AdminShell adminName={admin.name} role={admin.role}>{children}</AdminShell>;
}
