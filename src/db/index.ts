import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * Database connection.
 *
 * Uses libSQL, which is SQLite: `DATABASE_URL="file:./dev.db"` produces an
 * ordinary SQLite file on disk. It was chosen over the more common
 * better-sqlite3 driver because it ships prebuilt binaries for every platform
 * through npm and needs no C++ toolchain — so `npm install` works first time
 * on Windows, macOS and Linux without Visual Studio Build Tools or Xcode.
 * The same client also talks to a hosted Turso database later if the shop
 * outgrows a single file, with no code change beyond the URL.
 *
 * Server-side only. This module is never imported by a client component.
 *
 * Next.js re-evaluates modules on every hot reload in development, which would
 * open a new connection each time — caching on globalThis keeps one.
 *
 * Moving to PostgreSQL: replace this file's body with
 *   import { drizzle } from 'drizzle-orm/node-postgres';
 *   import { Pool } from 'pg';
 *   export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
 * Nothing else in the application imports the driver directly.
 */

function createConnection() {
  const client = createClient({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createConnection> };

export const db = globalForDb.db ?? createConnection();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export { schema };
