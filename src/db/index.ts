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

    // Small pool, but not one.
    //
    // This was briefly `max: 1`, to stop parallel build workers exhausting the
    // free-tier pooler. That is no longer a concern — the build does not touch
    // the database at all now (see the force-dynamic notes in the layouts) —
    // and one connection had a cost that showed up immediately as a slow site.
    //
    // A single page can issue several queries at once. The homepage opens with
    // a Promise.all of four. With one connection those four queue and run one
    // after another, each paying the full network round trip. Four is enough
    // for that group to go together.
    //
    // Not larger, because a serverless function serves one request at a time,
    // so anything beyond what a single page needs concurrently is idle
    // connections held per instance — and those multiply by instance count
    // under load. The transaction pooler provides the real concurrency.
    max: 4,

    // Release quickly so a finished invocation does not hold a slot.
    idle_timeout: 20,

    // Ten seconds, not fifteen. A connection that has not been established in
    // ten is not going to save the request — Vercel will have given up on the
    // whole function before the driver gives up on the socket, and the visitor
    // gets an opaque 504 instead of a page that says something went wrong.
    // Failing inside the request is worth more than failing outside it.
    connect_timeout: 10,

    // Ask the kernel to probe an idle socket after 20 seconds rather than the
    // default 60. This is what notices that the other end has gone away. It
    // does not help while the instance is frozen — a frozen process sends no
    // probes — but it catches the case where the instance is merely idle
    // between requests, which is the common one.
    keep_alive: 20,

    // Retire every connection after five minutes, even a healthy-looking one.
    //
    // This is the fix for requests that hang rather than fail. A serverless
    // instance is frozen between invocations, and while it is frozen the TCP
    // socket to the database can be closed at the other end — by the pooler,
    // by a NAT table, by anything in between. Nothing tells the frozen process.
    // When it wakes and reuses that socket, the query goes into a void and the
    // request waits indefinitely: one measured request took 242 seconds.
    //
    // A lifetime cap means a stale socket is discarded rather than reused.
    max_lifetime: 60 * 5,
  });

  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createConnection> };

export const db = globalForDb.db ?? createConnection();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export { schema };
