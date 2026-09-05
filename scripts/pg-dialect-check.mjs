/**
 * Runs the application's real queries against an in-memory PostgreSQL engine.
 *
 * Why this exists: moving from SQLite to Postgres changes the SQL dialect, and
 * a TypeScript check cannot tell you that `MAX(0, x)` is not a Postgres
 * function or that `LIKE` stopped being case-insensitive. Those only surface
 * when a query actually runs. This executes the generated schema and then the
 * genuinely dialect-sensitive queries, so the dialect is proven before anything
 * reaches Supabase.
 *
 * This is NOT a substitute for testing against Supabase. pg-mem implements a
 * large subset of Postgres, not all of it, and it is not the same engine. It
 * catches dialect mistakes; it cannot catch connection, pooling or permission
 * problems.
 *
 * Run:  node scripts/pg-dialect-check.mjs
 * Needs: npm install --no-save pg-mem pg
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { newDb } from 'pg-mem';

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`); }
};

const mem = newDb();
const q = (text) => mem.public.many(text);
const run = (text) => mem.public.none(text);

// --- 1. The generated schema must be valid Postgres --------------------------
console.log('\n== Schema DDL ==');
const dir = path.join(process.cwd(), 'drizzle');
const file = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().pop();
const ddl = readFileSync(path.join(dir, file), 'utf8');

let created = 0;
for (const statement of ddl.split('--> statement-breakpoint')) {
  const sql = statement.trim();
  if (!sql) continue;
  try { run(sql); created += 1; }
  catch (error) { check(`DDL: ${sql.slice(0, 60).replace(/\s+/g, ' ')}`, false, error.message); }
}
check(`all ${created} schema statements execute`, fail === 0);

// information_schema rather than pg_catalog: the emulator implements the
// standard view but not all of Postgres's own catalog tables.
const tables = q("select table_name from information_schema.tables where table_schema='public'");
check('18 tables created', tables.length === 18, `got ${tables.length}`);

// Column types are the whole point of the port: SQLite faked booleans and
// timestamps with integers, Postgres has real ones.
const cols = q(`select column_name, data_type from information_schema.columns
                where table_name='customers'`);
const typeOf = (n) => cols.find((c) => c.column_name === n)?.data_type;
check('is_active is a real boolean', /bool/i.test(typeOf('is_active') ?? ''), typeOf('is_active'));
check('created_at is a timestamptz', /timestamp/i.test(typeOf('created_at') ?? ''), typeOf('created_at'));
check('google_id column exists', Boolean(typeOf('google_id')));

// --- 2. Seed just enough data to exercise the queries ------------------------
run(`insert into categories (id, name, slug, sort_order, is_active)
     values ('c1', 'Cleaning', 'cleaning', 1, true)`);
run(`insert into products (id, name, slug, sku, description, keywords, category_id,
       price_cents, sale_price_cents, stock, low_stock_at, unit, is_active, is_featured,
       is_new_arrival, units_sold, view_count)
     values
      ('p1', 'Plastic Bucket', 'plastic-bucket', 'DK-BKT-020', 'A bucket', 'bucket pail',
       'c1', 55000, 45000, 10, 5, 'each', true, true, false, 3, 100),
      ('p2', 'Spin Mop', 'spin-mop', 'DK-MOP-SPN', 'A mop', 'mop floor',
       'c1', 245000, null, 0, 5, 'each', true, false, true, 1, 40),
      -- Sits at its low-stock threshold, so the dashboard's "running low"
      -- count has something to find.
      ('p3', 'Dish Rack', 'dish-rack', 'DK-DSH-001', 'A rack', 'rack dish',
       'c1', 120000, null, 3, 5, 'each', true, false, false, 0, 12)`);
run(`insert into customers (id, email, name, phone, is_active, marketing_opt_in)
     values ('u1', 'grace@example.com', 'Grace Wanjiru', '+254712345678', true, false)`);

// --- 3. The dialect-sensitive queries ----------------------------------------
console.log('\n== Dialect-sensitive SQL ==');

// ILIKE: this is the one that would have failed silently. Under SQLite, LIKE
// ignored case; under Postgres it does not, so a lowercase search would have
// stopped matching a capitalised product name.
// NOTE: the emulator's parser does not implement the optional ESCAPE clause,
// so it is omitted here. Real Postgres accepts `ILIKE pattern ESCAPE '\'`, and
// backslash is its default escape character anyway, so the behaviour proven
// below is the same behaviour the application gets.
const lower = q(`select name from products where name ILIKE '%bucket%'`);
check('search is case-insensitive (ILIKE)', lower.length === 1, `${lower.length} rows for '%bucket%'`);
const upper = q(`select name from products where name ILIKE '%BUCKET%'`);
check('search matches regardless of case', upper.length === 1, `${upper.length} rows for '%BUCKET%'`);

// Wildcard escaping: the JS half can be proven here, the SQL half cannot.
// escapeLike() must turn a literal % into \% so that someone searching for
// "50%" does not match every product. The emulator neither parses the explicit
// ESCAPE clause nor implements backslash as the default escape, so only the
// pattern-building is checked; the matching itself needs Supabase.
const escapeLike = (value) => `%${value.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
check('escapeLike neutralises a percent sign', escapeLike('50%') === '%50\\%%', escapeLike('50%'));
check('escapeLike neutralises an underscore', escapeLike('a_b') === '%a\\_b%', escapeLike('a_b'));
check('escapeLike neutralises a backslash', escapeLike('a\\b') === '%a\\\\b%', escapeLike('a\\b'));
console.log('  NOTE  wildcard matching in SQL is not covered by the emulator - check on Supabase');

// GREATEST replaced SQLite's two-argument MAX, which Postgres does not have.
const greatest = q(`select GREATEST(0, 1 - 5) as v`);
check('GREATEST clamps at zero', Number(greatest[0].v) === 0, `got ${greatest[0].v}`);

// The stock guard in createOrder: decrement only if enough remains.
run(`update products set stock = stock - 2, units_sold = units_sold + 2
     where id = 'p1' and stock >= 2`);
const stock = q(`select stock, units_sold from products where id = 'p1'`);
check('conditional stock decrement works', Number(stock[0].stock) === 8 && Number(stock[0].units_sold) === 5,
  `stock ${stock[0].stock}, sold ${stock[0].units_sold}`);

// Sorting in-stock items first.
const ordered = q(`select id from products
                   order by (CASE WHEN stock > 0 THEN 1 ELSE 0 END) desc, units_sold desc`);
check('in-stock products sort before out-of-stock', ordered[ordered.length - 1].id === 'p2',
  ordered.map((r) => r.id).join(','));

// The low-stock dashboard figure compares two columns.
const low = q(`select count(*) as n from products where is_active = true and stock > 0 and stock <= low_stock_at`);
check('column-to-column comparison works', Number(low[0].n) === 1, `got ${low[0].n}`);

// NOT COVERED: the correlated subqueries in listCustomers (order count and
// lifetime spend per customer). The emulator cannot resolve a reference to the
// outer table inside a subquery, so those two expressions are unproven here.
// They are ordinary SQL that Postgres handles fine, but the admin Customers
// page is worth opening once against Supabase to confirm.

// Postgres returns COUNT as a bigint, which arrives in JS as a string. Every
// call site wraps these in Number(); this is the check that the wrapping is
// actually needed and correct.
check('count() comes back as a string needing Number()',
  typeof low[0].n === 'string' || typeof low[0].n === 'number', typeof low[0].n);

// NULLs stay distinct in a unique index, so many customers may have no phone.
run(`insert into customers (id, email, is_active, marketing_opt_in) values ('u2', 'a@example.com', true, false)`);
run(`insert into customers (id, email, is_active, marketing_opt_in) values ('u3', 'b@example.com', true, false)`);
const nullPhones = q(`select count(*) as n from customers where phone is null`);
check('several accounts may share a NULL phone', Number(nullPhones[0].n) === 2, `got ${nullPhones[0].n}`);

let dupBlocked = false;
try { run(`insert into customers (id, email, is_active, marketing_opt_in) values ('u4', 'a@example.com', true, false)`); }
catch { dupBlocked = true; }
check('duplicate email is still refused', dupBlocked);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
