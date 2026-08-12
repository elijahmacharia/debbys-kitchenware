import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Used by `npm run db:push` and `npm run db:generate`.
 *
 * Handles both shapes of DATABASE_URL: a local `file:` path, and a hosted
 * Turso `libsql://` URL, which additionally needs TURSO_AUTH_TOKEN. That lets
 * you point the same command at production to create the tables there.
 */
const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const isRemote = !url.startsWith('file:');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isRemote ? 'turso' : 'sqlite',
  dbCredentials: isRemote
    ? { url, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: url.replace(/^file:/, '') },
  strict: false,
});
