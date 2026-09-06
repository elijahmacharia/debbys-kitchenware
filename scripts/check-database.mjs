/**
 * Checks the database connection and says, in plain language, what is wrong.
 *
 * This exists because every database problem on this project has announced
 * itself as something unhelpful: a 500 on the live site, "Changes applied" from
 * a migration that silently hit a throwaway file, or a sign-in page that
 * crashed. The failure was always obvious in hindsight and invisible at the
 * time. This turns those into a sentence you can act on.
 *
 * Run:  npm run db:check
 * Safe: it only reads. Nothing here writes, drops or migrates anything.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;

const say = (symbol, message) => console.log(`${symbol}  ${message}`);
const ok = (m) => say(' OK ', m);
const warn = (m) => say('WARN', m);
const bad = (m) => say('FAIL', m);

console.log('\nChecking the database connection...\n');

// --- 1. Is there a connection string at all? ---------------------------------
if (!url) {
  bad('DATABASE_URL is not set.');
  console.log(`
  Nothing can work without it, and the app now refuses to start rather than
  quietly falling back to a local file.

  Fix: copy .env.example to .env, then paste your Supabase connection string.
  Supabase -> Project Settings -> Database -> Connection string.
`);
  process.exit(1);
}

// --- 2. Is it the right SHAPE of string? -------------------------------------
if (url.startsWith('file:') || url.startsWith('libsql:')) {
  bad('DATABASE_URL still points at the old SQLite/Turso database.');
  console.log(`
  This project moved to PostgreSQL. The string should begin "postgresql://".
`);
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//.test(url)) {
  bad('DATABASE_URL does not look like a PostgreSQL connection string.');
  console.log('\n  It should begin "postgresql://".\n');
  process.exit(1);
}

// Any bracketed token, not just the ones I happened to think of. The first
// version of this check looked for [PASSWORD] and [REF] but not [REGION], so a
// half-filled string sailed past it and failed later with an unhelpful
// "could not be parsed as a URL".
const placeholders = url.match(/\[[^\]\s]+\]/g);
if (placeholders) {
  bad(`DATABASE_URL still contains a placeholder: ${placeholders.join(', ')}`);
  console.log(`
  Every bracketed section has to be replaced with a real value. The easiest
  fix is not to edit the template at all: go to Supabase -> Connect ->
  Transaction pooler and copy the whole string, which already has your project
  reference and region filled in. Then replace only the password part.

  The password is the one Supabase showed when you created the project. If you
  did not save it, reset it under Project Settings -> Database.
`);
  process.exit(1);
}

// --- 3. Is it the right KIND of Supabase string? -----------------------------
// This is the one people get wrong, and it fails only under real traffic.
/**
 * Shows the shape of the string without revealing the password.
 * Everything between the first ":" after the scheme and the last "@" is masked.
 */
function redact(value) {
  return value.replace(/(postgres(?:ql)?:\/\/[^:]*:)(.*)(@)/, (_, head, _pw, tail) => `${head}********${tail}`);
}

let host = '', port = '';
try {
  const parsed = new URL(url);
  host = parsed.hostname;
  port = parsed.port || '5432';
} catch (error) {
  bad(`DATABASE_URL could not be parsed as a URL: ${error.message}`);
  console.log(`\n  What is currently in .env (password masked):\n\n    ${redact(url)}\n`);

  // The usual culprits, in the order they actually happen.
  const atCount = (url.match(/@/g) ?? []).length;
  if (atCount > 1) {
    console.log(`  LIKELY CAUSE: the password contains an "@".

  A URL uses "@" to separate the credentials from the host, so a password
  containing one splits the string in the wrong place. Either regenerate the
  password in Supabase (Project Settings -> Database -> Reset password) and
  pick one without symbols, or percent-encode it: @ becomes %40.
`);
  } else if (/\s/.test(url)) {
    console.log(`  LIKELY CAUSE: there is a space or a line break inside the string.

  Long connection strings wrap visually in nano, which is fine, but a real
  newline in the middle breaks it. Re-open .env and make sure DATABASE_URL is
  a single unbroken line.
`);
  } else if (/[<>]/.test(url) || /\[[A-Za-z_ -]+\]/.test(url)) {
    console.log(`  LIKELY CAUSE: part of the string is still a placeholder.

  Replace the bracketed section with your real database password.
`);
  } else if (!url.includes('@')) {
    console.log(`  LIKELY CAUSE: no "@" at all, so the host is missing.

  The string should look like:
    postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
`);
  } else {
    const special = [...new Set((url.match(/[#?/[\]]/g) ?? []))];
    if (special.length > 0) {
      console.log(`  LIKELY CAUSE: the password contains ${special.join(' ')} which a URL treats as
  structure rather than text. Percent-encode them, or reset the password in
  Supabase and choose one without symbols:

    #  ->  %23        /  ->  %2F        ?  ->  %3F
    [  ->  %5B        ]  ->  %5D        @  ->  %40
`);
    }
  }
  process.exit(1);
}

ok(`Host looks reachable: ${host}:${port}`);

// An empty password is invisible in a masked string, so check it explicitly.
// Pasting into a hidden prompt is easy to get wrong: some terminals do not
// deliver a paste to `read -s` at all, and the result looks like success.
try {
  const parsed = new URL(url);
  if (!parsed.password) {
    bad('The password in DATABASE_URL is empty.');
    console.log(`
  The string is otherwise correct, but there is nothing between the ":" and
  the "@". If you used the hidden prompt, the paste may not have registered.
  Try again, and use Ctrl+Shift+V or a right-click paste.
`);
    process.exit(1);
  }
  if (/^\[.*\]$/.test(parsed.password) || parsed.password.toLowerCase().includes('password')) {
    warn('The password looks like a placeholder rather than a real value.');
  }
} catch { /* already validated above */ }

const pooled = host.includes('pooler.supabase.com');
if (pooled && port === '6543') {
  ok('Using the transaction pooler (port 6543), which is right for Vercel.');
} else if (pooled && port === '5432') {
  warn('This is the SESSION pooler (port 5432), not the transaction pooler.');
  console.log(`
  It will work locally. On Vercel it holds a connection per session, and under
  real traffic you will run out. Change the port to 6543 in Vercel, or pick
  "Transaction pooler" in the Supabase connection dialog.
`);
} else if (host.includes('supabase')) {
  warn('This looks like a DIRECT connection, not a pooled one.');
  console.log(`
  Fine for local work and migrations. On Vercel every serverless invocation
  opens its own connection and the limit is quickly exhausted, which shows up
  as intermittent 500s rather than a clean error. Use the transaction pooler
  string (port 6543) in Vercel.
`);
}

// --- 4. Can we actually reach it? --------------------------------------------
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });

try {
  const [{ version }] = await sql`select version()`;
  ok(`Connected. ${version.split(',')[0]}`);

  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;

  if (tables.length === 0) {
    warn('Connected, but there are no tables yet.');
    console.log('\n  Next: npm run db:push\n');
    await sql.end();
    process.exit(0);
  }

  ok(`${tables.length} tables present.`);

  const expected = [
    'addresses', 'admin_users', 'analytics_events', 'cart_items', 'categories',
    'contact_messages', 'customers', 'delivery_zones', 'order_events',
    'order_items', 'orders', 'password_reset_tokens', 'product_images',
    'products', 'settings', 'stock_movements', 'testimonials', 'wishlist_items',
  ];
  const present = new Set(tables.map((t) => t.table_name));
  const missing = expected.filter((t) => !present.has(t));
  if (missing.length > 0) {
    warn(`Missing tables: ${missing.join(', ')}`);
    console.log('\n  Next: npm run db:push\n');
  } else {
    ok('All 18 expected tables are there.');
  }

  // The column that caused the migration to fail on the old database. If it is
  // absent, sign-in will 500 on every attempt.
  const [googleCol] = await sql`
    select column_name from information_schema.columns
    where table_name = 'customers' and column_name = 'google_id'`;
  if (googleCol) ok('The customers table has google_id, so sign-in can work.');
  else {
    bad('customers.google_id is missing — sign-in will fail with a 500.');
    console.log('\n  Next: npm run db:push\n');
  }

  const [{ count: products }] = await sql`select count(*)::int as count from products`;
  const [{ count: cats }] = await sql`select count(*)::int as count from categories`;
  const [{ count: admins }] = await sql`select count(*)::int as count from admin_users`;
  const [{ count: orders }] = await sql`select count(*)::int as count from orders`;

  console.log(`\n  Contents: ${products} products, ${cats} categories, ${admins} admin users, ${orders} orders`);

  if (admins === 0) {
    console.log(`
  There is no admin account, so you cannot sign in to /admin.
  Run: npm run db:seed        (this also loads the demo products)
`);
  } else if (products === 0) {
    console.log(`
  No products yet. Either add them through /admin, or run npm run db:seed
  to load the 43 demo items.
`);
  } else if (orders > 0) {
    console.log(`
  NOTE: there are ${orders} orders in here. Do NOT run npm run db:seed — it
  deletes every order.
`);
  } else {
    console.log('\n  Everything looks ready.\n');
  }
} catch (error) {
  // Some driver errors arrive with an empty .message but a useful .code, and
  // "Could not connect:" followed by nothing helps no one.
  const parts = [error?.message, error?.code, error?.errno, error?.name]
    .filter((v) => v !== undefined && v !== null && String(v).length > 0);
  const message = parts.length > 0 ? parts.join(' / ') : `no details (${Object.prototype.toString.call(error)})`;
  bad(`Could not connect: ${message}`);

  if (parts.length === 0) {
    console.log(`
  The driver gave no reason, which usually means the connection was closed
  during the handshake. The most common causes:
    - the project is still starting up (wait a minute and retry)
    - the password is wrong
    - the project is paused (resume it from the Supabase dashboard)
`);
  }

  if (/password authentication failed/i.test(message)) {
    console.log(`
  The host answered, so the address is right — the password is wrong. Reset it
  under Supabase -> Project Settings -> Database, then update .env AND Vercel.
`);
  } else if (/ENOTFOUND|EAI_AGAIN/.test(message)) {
    console.log(`
  The hostname could not be resolved. Check it for typos, and check that the
  Supabase project has not been paused — free projects pause after inactivity
  and are resumed from the dashboard.
`);
  } else if (/ECONNREFUSED|ETIMEDOUT/.test(message)) {
    console.log(`
  Nothing is listening there. The usual cause is the wrong port: 6543 for the
  transaction pooler, 5432 for direct and session connections.
`);
  } else if (/SASL|SCRAM/i.test(message)) {
    console.log(`
  Authentication handshake failed. This usually means the username is wrong.
  Copy the whole string from Supabase again rather than editing it by hand.
`);
  }
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
}

await sql.end();
