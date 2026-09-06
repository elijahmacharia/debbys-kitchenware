import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection — PostgreSQL, hosted on Supabase.
 *
 * Server-side only. This module is never imported by a client component, and
 * nothing else in the application imports the driver directly, so swapping
 * hosts again would mean changing this file and nothing more.
 *
 * WHICH SUPABASE CONNECTION STRING TO USE
 *
 * Supabase offers three, and picking the wrong one is the usual cause of a site
 * that works locally and falls over in production:
 *
 *   Direct (port 5432)             one real Postgres connection per client.
 *                                  Fine locally. On Vercel it exhausts the
 *                                  connection limit, because every serverless
 *                                  invocation opens its own.
 *   Session pooler (port 5432)     pooled, but holds a connection per session.
 *   Transaction pooler (port 6543) pooled per statement. This is the one to
 *                                  use on Vercel, and the one this file is
 *                                  configured for.
 *
 * The transaction pooler cannot support prepared statements, because a
 * statement prepared on one physical connection may be executed on another.
 * Hence `prepare: false` below — without it queries fail intermittently and
 * confusingly, succeeding under light load and breaking under real traffic.
 *
 * Next.js re-evaluates modules on every hot reload in development, which would
 * open a new pool each time; caching on globalThis keeps one.
 */

function createConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Loud rather than silent. The previous SQLite setup quietly fell back to a
    // local file when this was unset, which meant a migration once ran against
    // a throwaway database on someone's laptop while the live one sat
    // untouched. A missing connection string should stop everything.
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and paste your Supabase connection string. ' +
      'See docs/TECHNICAL.md for which of the three Supabase strings to use.',
    );
  }

  const client = postgres(url, {
    // Required by Supabase's transaction pooler. Harmless on a direct
    // connection, so it is safe to leave on in every environment.
    prepare: false,

    // ONE connection per process, deliberately.
    //
    // The instinct is to allow a few, and this was `max: 5` at first. That is
    // wrong here for two reasons.
    //
    // A serverless function handles one request at a time, so a pool of five
    // means four idle connections held open per running instance. Multiply by
    // the number of instances under load and the database's connection limit
    // is reached while almost every connection sits doing nothing. The
    // transaction pooler in front of Postgres is what provides concurrency;
    // this pool does not need to.
    //
    // It also broke the build. `next build` runs several workers in parallel,
    // each opening its own pool, and the free-tier pooler ran out of client
    // connections. Pages then blocked waiting for one and tripped Next's
    // 60-second prerender limit. The tell was that a *different* page failed
    // on each run — /categories locally, /about and /faq on Vercel — which is
    // the signature of contention rather than a broken page.
    max: 1,

    // Release quickly so a finished invocation does not hold a slot.
    idle_timeout: 20,
    connect_timeout: 15,
  });

  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createConnection> };

export const db = globalForDb.db ?? createConnection();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export { schema };
