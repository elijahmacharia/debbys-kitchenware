import type { Metadata } from 'next';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { getDashboardStats, getLowStockProducts, getPopularProducts, getRecentOrders } from '@/lib/queries/admin';
import { Alert } from '@/components/ui/Alert';

/**
 * A page that says what is actually wrong with the database.
 *
 * Why this exists: when a page throws in production, Next shows the customer a
 * polite "Something went wrong" and keeps the real exception in a server log.
 * That is correct behaviour — an error message can name tables and columns, and
 * customers should never see it. But it means the owner of the shop, looking at
 * their own broken dashboard, has no more information than a stranger would.
 *
 * This page closes that gap. It runs the same queries the dashboard runs, one
 * at a time, catches each failure, and prints it. A missing table, a renamed
 * column or a dialect mistake shows up here as a sentence instead of a shrug.
 *
 * It is safe to leave in place:
 *   - it sits inside the admin dashboard group, so the layout has already
 *     rejected anyone who is not signed in as staff;
 *   - it only reads. There is no query here that writes, drops or migrates;
 *   - it prints the database host and port but never the password, because a
 *     screenshot of this page will end up in a chat window sooner or later.
 */

export const metadata: Metadata = { title: 'Diagnostics', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Every table the application expects. Kept in step with scripts/check-database.mjs. */
const EXPECTED_TABLES = [
  'addresses', 'admin_users', 'analytics_events', 'cart_items', 'categories',
  'contact_messages', 'customers', 'delivery_zones', 'order_events',
  'order_items', 'orders', 'password_reset_tokens', 'product_images',
  'products', 'settings', 'stock_movements', 'testimonials', 'wishlist_items',
];

/**
 * Turns a thrown value into something readable.
 *
 * Postgres driver errors carry the useful part in `code` and `detail` rather
 * than `message` — a bare message is often just "error", which helps nobody.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const extra = error as Error & { code?: string; detail?: string; hint?: string };
  return [
    extra.message,
    extra.code ? `code ${extra.code}` : null,
    extra.detail ?? null,
    extra.hint ?? null,
  ].filter(Boolean).join(' — ');
}

/** Runs one check and never throws, so one failure cannot hide the others. */
async function attempt(name: string, run: () => Promise<unknown>) {
  const startedAt = Date.now();
  try {
    const value = await run();
    const rows = Array.isArray(value) ? `${value.length} rows` : 'ok';
    return { name, ok: true, detail: rows, ms: Date.now() - startedAt };
  } catch (error) {
    return { name, ok: false, detail: describe(error), ms: Date.now() - startedAt };
  }
}

/** Host and port only. Never the password. */
function connectionSummary(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return 'DATABASE_URL is not set';
  try {
    const parsed = new URL(raw);
    return `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return 'DATABASE_URL is set but could not be parsed as a URL';
  }
}

export default async function DiagnosticsPage() {
  // The table inventory is itself a query that can fail, so it gets the same
  // treatment as everything else.
  let presentTables: string[] = [];
  let tableError: string | null = null;
  try {
    // Cast rather than use a generic: the driver's result type differs between
    // Drizzle's Postgres adapters, and information_schema returns plain rows.
    const rows = (await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    )) as unknown as Array<{ table_name: string }>;
    presentTables = rows.map((row) => row.table_name);
  } catch (error) {
    tableError = describe(error);
  }

  const missing = EXPECTED_TABLES.filter((t) => !presentTables.includes(t));
  const unexpected = presentTables.filter((t) => !EXPECTED_TABLES.includes(t));

  // The four calls the dashboard makes, run separately so we learn which one
  // is the problem rather than only that there is one.
  const checks = await Promise.all([
    attempt('getDashboardStats() — the 13 summary figures', () => getDashboardStats()),
    attempt('getRecentOrders() — reads orders', () => getRecentOrders(8)),
    attempt('getPopularProducts() — reads products', () => getPopularProducts(5)),
    attempt('getLowStockProducts() — products joined to categories', () => getLowStockProducts(6)),
  ]);

  const failures = checks.filter((c) => !c.ok);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Diagnostics</h1>
        <p className="mt-1 text-sm text-muted">
          What the database is doing, in plain language. Nothing on this page changes anything.
        </p>
      </div>

      {failures.length === 0 && missing.length === 0 && !tableError ? (
        <Alert tone="success" title="Everything the dashboard needs is working">
          All expected tables are present and all four dashboard queries succeeded. If the
          dashboard is still failing, the cause is in the page itself rather than the database.
        </Alert>
      ) : (
        <Alert tone="error" title="Found a problem">
          The details are below. The first failing item is usually the whole story.
        </Alert>
      )}

      <section className="admin-panel p-5" aria-labelledby="connection">
        <h2 id="connection" className="text-sm font-bold">Connection</h2>
        <p className="mt-2 break-all font-mono text-xs text-muted">{connectionSummary()}</p>
        <p className="mt-2 text-xs text-subtle">
          Port 6543 is the transaction pooler, which is the correct one here. Port 5432 will work
          but runs out of connections under real traffic. The password is deliberately not shown.
        </p>
      </section>

      <section className="admin-panel p-5" aria-labelledby="tables">
        <h2 id="tables" className="text-sm font-bold">Tables</h2>
        {tableError ? (
          <p className="mt-2 text-sm text-danger">Could not list the tables: {tableError}</p>
        ) : (
          <>
            <p className="mt-2 text-sm">
              {presentTables.length} present, {EXPECTED_TABLES.length} expected.
            </p>
            {missing.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-danger">Missing:</p>
                <p className="mt-1 break-all font-mono text-xs">{missing.join(', ')}</p>
                <p className="mt-2 text-xs text-muted">
                  A missing table means the schema was never fully applied. The fix is to run
                  <code className="mx-1">npm run db:push</code> against this database.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Nothing missing.</p>
            )}
            {unexpected.length > 0 ? (
              <p className="mt-3 break-all text-xs text-subtle">
                Also present, not used by the app: {unexpected.join(', ')}
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="admin-panel p-5" aria-labelledby="queries">
        <h2 id="queries" className="text-sm font-bold">The dashboard&rsquo;s queries</h2>
        <ul className="mt-3 space-y-3">
          {checks.map((check) => (
            <li key={check.name} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-semibold">
                <span className={check.ok ? 'text-ink' : 'text-danger'}>
                  {check.ok ? 'OK' : 'FAILED'}
                </span>{' '}
                {check.name}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted">
                {check.detail} · {check.ms}ms
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-subtle">
          Times over about a second mean the query is slow rather than broken. Under 300ms is
          normal now that the site runs in the same region as the database.
        </p>
      </section>
    </div>
  );
}
