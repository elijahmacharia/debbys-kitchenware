import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Used by `npm run db:push` and `npm run db:generate`.
 *
 * There is no local fallback on purpose. The SQLite version defaulted to a file
 * on disk when DATABASE_URL was unset, which meant `db:push` could report
 * "Changes applied" while quietly building tables in a throwaway file and
 * leaving the real database untouched. That happened, and it cost an afternoon.
 * Failing loudly is better.
 *
 * Schema changes go to whichever database DATABASE_URL names, so check it
 * before running this against anything that matters.
 */
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'DATABASE_URL is not set, so there is no database to push to. ' +
    'Copy .env.example to .env and paste your Supabase connection string.',
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: false,
});
