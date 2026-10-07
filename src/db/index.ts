import net from 'node:net';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Options as PostgresOptions } from 'postgres';
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

/**
 * How long a pool may be reused. Vercel freezes the process between requests,
 * so the driver's idle and lifetime timers do not run while it is frozen, and
 * a socket the pooler has already dropped still looks open. The next query
 * then waits until the platform kills the function. Wall-clock age still
 * advances during a freeze, so this is checked before every query.
 */
const CLIENT_MAX_AGE_MS = 15_000;

/** Give up when a socket goes quiet. A dropped connection never sends data. */
const SOCKET_QUIET_MS = 12_000;

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

  const sockets = new Set<net.Socket>();
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

    // Close an idle socket quickly once this process is actually running.
    // One second is long enough for the queries on a single page to share a
    // connection, and short enough that a finished request does not keep a
    // pooler slot while the instance sits idle.
    idle_timeout: 1,

    // Ten seconds, not fifteen. A connection that has not been established in
    // ten is not going to save the request — Vercel will have given up on the
    // whole function before the driver gives up on the socket, and the visitor
    // gets an opaque 504 instead of a page that says something went wrong.
    // Failing inside the request is worth more than failing outside it.
    connect_timeout: 10,

    keep_alive: 20,

    // Backup for the wall-clock check below. The timer does not fire while
    // the instance is frozen, so it is not the thing that prevents a hang.
    max_lifetime: 15,

    // Own the socket so a connection that stops sending data is destroyed.
    // The driver otherwise waits on that socket until the platform times the
    // whole function out, which is the multi-minute page load.
    socket(options: { host: string[]; port: number[] }) {
      const host = options.host[0];
      const port = options.port[0];
      return new Promise<net.Socket>((resolve, reject) => {
        const socket = net.connect({ host, port });
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
        socket.setTimeout(SOCKET_QUIET_MS);
        socket.on('timeout', () => {
          socket.destroy(new Error('The database stopped answering'));
        });
        socket.once('error', reject);
        socket.once('connect', () => {
          socket.removeListener('error', reject);
          // The driver reads these when it upgrades the socket to TLS.
          (socket as net.Socket & { host?: string; port?: number }).host = host;
          (socket as net.Socket & { host?: string; port?: number }).port = port;
          resolve(socket);
        });
      });
    },
  } as PostgresOptions<Record<string, never>>);

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
      for (const socket of sockets) socket.destroy();
      void client.end({ timeout: 0 });
    },
  };
}

type Database = ReturnType<typeof createConnection>['database'];

const globalForDb = globalThis as unknown as {
  connection?: { database: Database; openedAt: number; close: () => void };
};

/**
 * Open the pool on the first query, not when this module is imported.
 *
 * Next evaluates every route module while it collects page data, including
 * API routes that only import `db`. Creating the client at import time made
 * `next build` throw "DATABASE_URL is not set" on Vercel before any request
 * ran, even though those routes are dynamic and the build is not supposed to
 * touch the database. The sitemap is the one route that does query during
 * the build; it already catches a failure and ships the static pages.
 *
 * A pool is also replaced once it is older than CLIENT_MAX_AGE_MS. That is
 * what stops a thawed serverless instance from sending a query down a socket
 * the pooler closed while the instance was frozen.
 */
function getDb(): Database {
  const now = Date.now();
  const current = globalForDb.connection;
  if (current && now - current.openedAt < CLIENT_MAX_AGE_MS) return current.database;
  current?.close();
  const connection = createConnection();
  globalForDb.connection = { database: connection.database, openedAt: now, close: connection.close };
  return connection.database;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const database = getDb();
    const value = database[prop as keyof Database];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(database) : value;
  },
});

export { schema };
