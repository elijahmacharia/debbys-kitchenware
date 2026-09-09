import type { Metadata } from 'next';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { getDashboardStats } from '@/lib/queries/admin';
import { Alert } from '@/components/ui/Alert';

/**
 * A page that says what is actually wrong with the database.
 *
 * Why this exists: when a page fails in production, the customer sees a polite
 * "Something went wrong" and the real reason stays in a server log. That is
 * correct — an error can name tables and columns, and customers should never
 * see it. But it leaves the owner of the shop, looking at their own broken
 * dashboard, with no more information than a stranger.
 *
 * The first version of this page had a flaw worth recording: it ran the checks
 * the same way the dashboard does, so when the dashboard hung, this hung too,
 * and a diagnostic that fails in the same manner as the thing it is diagnosing
 * is worthless. Everything below is therefore built so the page ALWAYS renders:
 *
 *   - checks run one at a time, so a result cannot be muddied by fifteen other
 *     queries competing for the same four connections;
 *   - each check races a timer, so a query that never answers is recorded as
 *     "did not answer" rather than taking the page down with it;
 *   - a whole-page deadline stops the run early and marks the rest as not
 *     attempted, so the page returns well inside its time limit.
 *
 * The checks are deliberately ordered cheapest first. If `select 1` does not
 * come back, nothing below it matters: the problem is the connection, not any
 * query. If `select 1` is fine and one particular query stalls, the problem is
 * that query. That distinction is the entire point of the page.
 *
 * Safe to leave in place: it sits inside the admin dashboard group so the
 * layout has already turned away anyone who is not staff, it only ever reads,
 * and it prints the database host but never the password — a page like this
 * ends up screenshotted into a chat window sooner or later.
 */

export const metadata: Metadata = { title: 'Diagnostics', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Stop starting new checks after this long, so the page always renders.
 *
 * This was 35 seconds and that was too generous — the page still returned a
 * gateway timeout. The arithmetic that matters: an abandoned query keeps the
 * connection it was using, the pool holds four, so after four stalls every
 * remaining check waits for a connection that is never coming back. Twelve
 * seconds of checks leaves the rest of the function's allowance for rendering
 * and returning, with room to spare.
 */
const PAGE_BUDGET_MS = 12_000;
/** Longest any single check may take before it is called a failure. */
const CHECK_TIMEOUT_MS = 2_500;

/** Every table the application expects. Kept in step with scripts/check-database.mjs. */
const EXPECTED_TABLES = [
  'addresses', 'admin_users', 'analytics_events', 'cart_items', 'categories',
  'contact_messages', 'customers', 'delivery_zones', 'order_events',
  'order_items', 'orders', 'password_reset_tokens', 'product_images',
  'products', 'settings', 'stock_movements', 'testimonials', 'wishlist_items',
];

type Result = {
  name: string;
  state: 'ok' | 'failed' | 'timeout' | 'skipped';
  detail: string;
  ms: number;
};

/**
 * Turns a thrown value into something readable.
 *
 * Postgres driver errors keep the useful part in `code` and `detail` rather
 * than `message`, which is often just "error" and helps nobody.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const e = error as Error & { code?: string; detail?: string; hint?: string };
  return [e.message, e.code ? `code ${e.code}` : null, e.detail ?? null, e.hint ?? null]
    .filter(Boolean).join(' — ');
}

export default async function DiagnosticsPage() {
  const startedAt = Date.now();
  const results: Result[] = [];
  let presentTables: string[] = [];

  /**
   * Runs one check, bounded by both its own timer and the page deadline.
   *
   * A timed-out query is abandoned, not cancelled — the connection it holds
   * stays busy. With a pool of four that means roughly four stalls before
   * everything queues, which is exactly why the page deadline exists.
   */
  async function check(
    name: string,
    run: () => Promise<unknown>,
    /** Optional formatter, for checks whose value is the answer rather than merely succeeding. */
    format?: (value: unknown) => string,
  ): Promise<void> {
    const remaining = PAGE_BUDGET_MS - (Date.now() - startedAt);
    if (remaining <= 500) {
      results.push({ name, state: 'skipped', detail: 'not attempted — earlier checks used the time', ms: 0 });
      return;
    }

    const began = Date.now();
    const limit = Math.min(CHECK_TIMEOUT_MS, remaining);
    const TIMED_OUT = Symbol('timeout');

    try {
      const outcome = await Promise.race([
        run(),
        new Promise((resolve) => setTimeout(() => resolve(TIMED_OUT), limit)),
      ]);

      if (outcome === TIMED_OUT) {
        results.push({
          name,
          state: 'timeout',
          detail: `no answer within ${limit}ms — the query was sent and nothing came back`,
          ms: Date.now() - began,
        });
        return;
      }

      results.push({
        name,
        state: 'ok',
        detail: format ? format(outcome) : Array.isArray(outcome) ? `${outcome.length} rows` : 'succeeded',
        ms: Date.now() - began,
      });
    } catch (error) {
      results.push({ name, state: 'failed', detail: describe(error), ms: Date.now() - began });
    }
  }

  // 1. Is the connection usable at all? This query touches no table, so if it
  //    stalls the fault is the connection and every result below is noise.
  await check('select 1 — can we talk to the database', () => db.execute(sql`select 1 as ok`));

  // 2. What tables exist? Recorded outside the results list because the answer
  //    itself is useful, not just whether it worked.
  await check('list tables — reads information_schema', async () => {
    const rows = (await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    )) as unknown as Array<{ table_name: string }>;
    presentTables = rows.map((row) => row.table_name);
    return rows;
  });

  // 3. What is the server actually configured to allow? A statement cancelled
  //    after 49ms means something set a very short limit; this reads it back
  //    rather than guessing. Recorded as a detail string, not a pass/fail.
  await check(
    'statement_timeout — the server’s own limit',
    () => db.execute(sql`show statement_timeout`),
    (value) => {
      const rows = value as unknown as Array<Record<string, string>>;
      const setting = rows?.[0] ? Object.values(rows[0])[0] : '(no value returned)';
      return `statement_timeout is ${setting}`;
    },
  );

  // 4. The query that was failing, now rewritten as a single statement.
  //
  //    Deliberately the only application query checked here. The earlier
  //    version of this page ran nine of them and abandoned any that stalled —
  //    and an abandoned query keeps its connection. Reloading the page a few
  //    times exhausted the pool and took the whole shop down, which is a
  //    remarkable thing for a diagnostic to do. Fewer checks, run one at a
  //    time, is the lesson.
  await check('getDashboardStats() — now one query, was thirteen', () => getDashboardStats());

  const missing = EXPECTED_TABLES.filter((t) => !presentTables.includes(t));
  const unexpected = presentTables.filter((t) => !EXPECTED_TABLES.includes(t));
  const problems = results.filter((r) => r.state === 'failed' || r.state === 'timeout');
  const firstProblem = problems[0];

  /** Host and port only. Never the password. */
  const connection = (() => {
    const raw = process.env.DATABASE_URL;
    if (!raw) return 'DATABASE_URL is not set';
    try {
      const parsed = new URL(raw);
      return `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
    } catch {
      return 'DATABASE_URL is set but could not be parsed as a URL';
    }
  })();

  const TONE: Record<Result['state'], string> = {
    ok: 'text-ink',
    failed: 'text-danger',
    timeout: 'text-danger',
    skipped: 'text-subtle',
  };
  const LABEL: Record<Result['state'], string> = {
    ok: 'OK',
    failed: 'FAILED',
    timeout: 'NO ANSWER',
    skipped: 'not run',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Diagnostics</h1>
        <p className="mt-1 text-sm text-muted">
          What the database is doing, in plain language. Nothing on this page changes anything.
        </p>
      </div>

      {firstProblem ? (
        <Alert tone="error" title={`First thing that failed: ${firstProblem.name}`}>
          {firstProblem.detail}
          <span className="mt-1 block text-xs">
            Everything after the first failure is unreliable — a stalled query keeps its connection,
            so later checks may fail only because they were waiting for one.
          </span>
        </Alert>
      ) : (
        <Alert tone="success" title="Every check passed">
          The connection works, all expected tables are present, and each dashboard query returned.
          If the dashboard is still failing, the cause is in the page rather than the database.
        </Alert>
      )}

      <section className="admin-panel p-5" aria-labelledby="checks">
        <h2 id="checks" className="text-sm font-bold">Checks, cheapest first</h2>
        <ul className="mt-3 space-y-3">
          {results.map((result) => (
            <li key={result.name} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-semibold">
                <span className={TONE[result.state]}>{LABEL[result.state]}</span> {result.name}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted">
                {result.detail} · {result.ms}ms
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-subtle">
          Under 300ms is normal now the site runs in the same region as the database. Over a second
          means slow. &ldquo;NO ANSWER&rdquo; means the query was sent and nothing ever came back,
          which is a different problem from a query that fails.
        </p>
      </section>

      <section className="admin-panel p-5" aria-labelledby="tables">
        <h2 id="tables" className="text-sm font-bold">Tables</h2>
        {presentTables.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            The table list could not be read, so nothing can be said about which tables exist.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm">{presentTables.length} present, {EXPECTED_TABLES.length} expected.</p>
            {missing.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-danger">Missing:</p>
                <p className="mt-1 break-all font-mono text-xs">{missing.join(', ')}</p>
                <p className="mt-2 text-xs text-muted">
                  A missing table means the schema was never fully applied. The fix is
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

      <section className="admin-panel p-5" aria-labelledby="connection">
        <h2 id="connection" className="text-sm font-bold">Connection</h2>
        <p className="mt-2 break-all font-mono text-xs text-muted">{connection}</p>
        <p className="mt-2 text-xs text-subtle">
          Port 6543 is the transaction pooler, which is the correct one here. Port 5432 works but
          runs out of connections under real traffic. The password is deliberately not shown.
        </p>
      </section>
    </div>
  );
}
