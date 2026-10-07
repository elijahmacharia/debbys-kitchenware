import { cache } from 'react';
import { after } from 'next/server';
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
 * Each request opens its own pool and closes it when the response finishes.
 * Reusing one pool for the life of a Vercel instance does not work: the
 * instance is frozen between requests, the pooler's socket is gone when it
 * thaws, and the next page waits on that dead socket.
 */

function createConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Loud rather than silent. The previous SQLite setup quietly fell back to a
    // local file when this was unset, which meant a migration once ran against
    // a throwaway database on someone's laptop while the live one sat
    // untouched. A missing connection string should stop the request that
    // needs the database, not the whole deploy.
    throw new Error(
      'DATABASE_URL is not set. Locally, copy .env.example to .env and paste your Supabase connection string. ' +
      'On Vercel, add DATABASE_URL under Project Settings → Environment Variables (the transaction pooler string, port 6543). ' +
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

    // The request closes the pool when it finishes. This only matters if that
    // cleanup does not run: an idle socket should not sit there for minutes.
    idle_timeout: 20,

    // Ten seconds, not fifteen. A connection that has not been established in
    // ten is not going to save the request — Vercel will have given up on the
    // whole function before the driver gives up on the socket, and the visitor
    // gets an opaque 504 instead of a page that says something went wrong.
    // Failing inside the request is worth more than failing outside it.
    connect_timeout: 10,

    keep_alive: 20,
    max_lifetime: 60,
  });

  const database = drizzle(client, { schema });

  // Drizzle replaces the timestamp serializers with `(value) => value` so
  // driver values stay strings. A Date still reaches Bind, and postgres.js
  // throws "Received an instance of Date" instead of sending the query.
  // Stringify dates here so a raw timestamp parameter cannot take a page down.
  for (const oid of [1082, 1083, 1114, 1184]) {
    client.options.serializers[oid] = (value: unknown) =>
      value instanceof Date ? value.toISOString() : String(value);
  }

  return {
    database,
    close() {
      void client.end({ timeout: 0 });
    },
  };
}

type Database = ReturnType<typeof createConnection>['database'];

/**
 * One pool for the current request, closed after the response is sent.
 *
 * Next evaluates every route module while it collects page data, including
 * API routes that only import `db`. Creating the client at import time made
 * `next build` throw "DATABASE_URL is not set" on Vercel before any request
 * ran. The pool therefore opens on the first query.
 *
 * It must not outlive the request. A Vercel instance is frozen afterwards,
 * and the socket it was holding is no longer connected when the instance
 * thaws. `cache` keeps the queries on one page sharing a pool. `after`
 * closes that pool once the response has gone out.
 */
const connectionForRequest = cache(() => {
  const connection = createConnection();
  try {
    after(() => connection.close());
  } catch {
    // Scripts and other non-request callers have nothing to attach cleanup to.
  }
  return connection;
});

function getDb(): Database {
  return connectionForRequest().database;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const database = getDb();
    const value = database[prop as keyof Database];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(database) : value;
  },
});

export { schema };
