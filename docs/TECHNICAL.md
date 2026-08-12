# Technical documentation

## Architecture

Next.js 15 App Router, one deployable unit. Two route groups keep the two
audiences apart:

```
src/app/
  (storefront)/   Public shop. Header, footer, cart provider, WhatsApp
                  button, PWA install prompt, service worker registration.
  (admin)/admin/  Staff dashboard. None of the above — no shop chrome, no
                  cart code in the bundle, and no service worker, so staff
                  and customer data are never cached offline.
  api/            JSON endpoints for browser-driven interactions.
```

The root layout holds only `<html>`, `<body>` and the toast provider, so nothing
storefront-specific leaks into the admin area.

**Reads** happen in server components calling `src/lib/queries/*`. **Writes**
happen either in a route handler under `api/` (when the browser needs JSON —
cart, auth, orders) or a server action in `src/app/(admin)/admin/actions.ts`
(admin forms).

### Layers

| Layer | Location | Rule |
| --- | --- | --- |
| Configuration | `src/lib/config.ts` | Business info from env. Nothing else reads `process.env` for it |
| Database | `src/db/` | Only place that knows the driver |
| Queries | `src/lib/queries/` | Marked `server-only`. All reads |
| Business logic | `src/lib/orders/`, `src/lib/orders.ts` | Order creation, status rules |
| Validation | `src/lib/validation.ts` | Zod schemas shared by client and server |
| API | `src/app/api/` | Thin: authorise, validate, delegate, respond |
| UI | `src/components/` | No database imports |

`server-only` is a real package: importing a query module from a client
component fails the build rather than shipping the driver to the browser.

---

## Database

libSQL (SQLite) via Drizzle ORM. Schema in `src/db/schema.ts`.

### Conventions

- **Money is integer cents.** `45000` is KSh 450. Floating point cannot
  represent 0.1 exactly, and an invoice cannot be "nearly" right.
- **Primary keys are 24-character random strings** (`src/lib/id.ts`, crypto RNG).
  Sequential integers would let anyone walk `/order-confirmation/1`,
  `/order-confirmation/2`.
- **Order rows snapshot the product** — name, SKU, slug, image and unit price at
  the time of sale. Editing a price next month does not rewrite last month's
  invoice.
- **Timestamps are unix integers**, surfaced as JS `Date`.

### Tables

| Table | Purpose | Notable columns |
| --- | --- | --- |
| `admin_users` | Staff logins | `role` (OWNER/STAFF), `is_active` |
| `customers` | Optional accounts | Unique `phone` and `email`, `marketing_opt_in` |
| `password_reset_tokens` | Reset flow | `token_hash` (SHA-256), `expires_at`, `used_at` |
| `addresses` | Saved delivery addresses | County/town/area/estate/landmark/directions, `is_default` |
| `categories` | Nested departments | Self-referencing `parent_id`, `sort_order` |
| `products` | Catalogue | `price_cents`, `sale_price_cents`, `stock`, `low_stock_at`, `keywords`, flags, `view_count`, `units_sold` |
| `product_images` | Gallery | `alt` is NOT NULL — accessibility and image SEO |
| `stock_movements` | Audit trail | Signed `delta`, `reason`, optional `order_id` |
| `cart_items` | Server-side cart | Unique on (customer, product) |
| `wishlist_items` | Wishlist | Unique on (customer, product) |
| `delivery_zones` | Areas and fees | `fee_cents`, `eta_text`, `is_active` |
| `orders` | Orders | `order_number` (human), `public_id` (URL), nullable `customer_id` for guests, address snapshot, `admin_note` |
| `order_items` | Lines | Nullable `product_id` so deleting a product never destroys history |
| `order_events` | Status history | Drives the customer timeline |
| `settings` | Owner-editable copy | Key/value |
| `testimonials` | Reviews | `is_published` false by default — nothing is invented |
| `contact_messages` | Contact form | |
| `analytics_events` | First-party counts | No personal data, no cookies |

Indexes cover every filter and sort the UI offers: category, active+featured,
active+new, active+created, price, order status+date, customer+date, and order
phone (admin search).

### Moving to PostgreSQL

Two files change. Nothing else.

1. `npm install pg drizzle-orm` and `npm install -D @types/pg`
2. **`src/db/index.ts`** — replace the body:
   ```ts
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { Pool } from 'pg';
   import * as schema from './schema';
   export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
   ```
3. **`src/db/schema.ts`** — change the import from `drizzle-orm/sqlite-core` to
   `drizzle-orm/pg-core`, swap `sqliteTable` for `pgTable`, replace the `bool`
   helper with `boolean(name).notNull().default(x)`, and replace
   `integer(name, { mode: 'timestamp' })` with `timestamp(name)`. The `text`,
   `integer`, `index` and `uniqueIndex` calls are unchanged.
4. **`drizzle.config.ts`** — `dialect: 'postgresql'`
5. `DATABASE_URL="postgresql://user:pass@host:5432/db"`, then
   `npx drizzle-kit push`

No page, API route, query or component needs editing — they only ever touch
Drizzle's query builder, never raw dialect-specific SQL.

---

## Authentication

`src/lib/auth.ts`. No third-party auth service.

- **Passwords**: bcrypt, cost 12. Nothing anywhere can read a password back.
- **Sessions**: signed JWTs (HS256, `jose`) in httpOnly, SameSite=Lax cookies,
  `secure` in production.
- **Two audiences**: customer tokens carry `aud: 'customer'`, admin tokens
  `aud: 'admin'`, and each is verified against its expected audience. A customer
  token replayed at an admin route fails verification even though the signing
  key is shared. Different cookie names too.
- **Expiry**: customers 30 days, admins 8 hours.
- **Live re-check**: `getCurrentCustomer()` / `getCurrentAdmin()` re-read the row
  and check `is_active`, so disabling an account takes effect immediately rather
  than when the token happens to expire.
- **Guest order access**: an httpOnly cookie holds the `public_id`s of orders
  placed in that browser. The confirmation page checks membership. Another
  browser gets a 404 — verified by test.

### Password reset

Tokens are 32 random bytes. Only the **SHA-256 hash** is stored, so a leaked
database cannot be used to reset anyone's password. One hour expiry, single use,
and completing a reset burns every other outstanding token for that account.

**Delivery is not wired up.** No email or SMS provider is configured, so the link
is written to the server log (`src/app/api/auth/forgot-password/route.ts`).
Adding a provider is a change to that one function.

---

## Cart

`src/components/cart/CartProvider.tsx`.

localStorage is the working copy, so add-to-cart is instant and a guest's basket
survives a closed tab. Three rules make that safe:

1. **Prices held client-side are display only.** The order API re-reads every
   price from the database. Editing localStorage changes nothing but your own
   screen — verified by a test that submits `totalCents: 1` and gets charged the
   real 45000.
2. **Revalidated** on page load and again immediately before submitting an
   order. Price changes, stock drops and withdrawn products are reported to the
   customer, not silently applied.
3. **Mirrored to the database** for signed-in customers (debounced 800ms) so the
   cart follows them between devices.

**Merge on sign-in** uses `max()`, not `sum()`. 2 buckets on a phone and 3 on a
laptop means 3, not 5. Everything is then capped to live stock.

---

## Checkout and order creation

`src/lib/orders/createOrder.ts` is the only place stock and money change.

1. Prices are read from the database. The request supplies product ids and
   quantities and nothing else that affects the total.
2. The delivery fee comes from the zone row, and only an active zone is accepted.
3. Everything runs in **one transaction**.
4. Stock is decremented conditionally — `WHERE stock >= quantity` — and the
   affected row count is checked. Two customers buying the last bucket
   simultaneously cannot both succeed.
5. Order number is `DK-YYMM-NNNN`, sequence resetting monthly.
6. **`payment_status` is always `PENDING`.** No code path sets it to `PAID`
   except a human in the admin dashboard.

Failure aborts the transaction and returns which items are unavailable, so the
cart page can name them.

Duplicate submission is prevented by disabling the submit button while a request
is in flight, plus a rate limit of 8 orders per 10 minutes per IP.

---

## WhatsApp

`src/lib/whatsapp.ts` is the only place the number is read and the only place
messages are built. `waLink()` returns `null` when no number is configured, and
every caller renders nothing rather than a dead button.

Three message builders: general enquiry, product enquiry, and full order (used
by the cart, checkout and both order pages). All are generated from live data.

---

## API endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/search/suggest` | public | Typeahead, rate limited 60/min |
| POST | `/api/cart/validate` | public | Live price/stock for cart ids |
| GET/PUT | `/api/cart` | customer | Server-side cart mirror |
| POST | `/api/orders` | optional | Place an order (guest or member) |
| POST/DELETE | `/api/wishlist` | customer | Add/remove |
| GET/POST | `/api/account/addresses` | customer | List/create |
| PATCH/DELETE | `/api/account/addresses/[id]` | customer | Scoped to owner |
| PATCH | `/api/account/profile` | customer | Update details |
| POST | `/api/account/password` | customer | Requires current password |
| PATCH | `/api/account/preferences` | customer | Marketing opt-in |
| POST | `/api/auth/register` `login` `logout` | public | 5–10/15min |
| POST | `/api/auth/forgot-password` `reset-password` | public | 5–10/15min |
| POST | `/api/admin/auth/login` `logout` | public/admin | 5/15min |
| GET | `/api/delivery-zones` | public | Active zones |
| POST | `/api/contact` | public | 5/15min, honeypot |
| POST | `/api/track` | public | Analytics beacon, fixed event names only |

Admin mutations are server actions, not REST endpoints. Each one calls
`requireAdmin()` **inside the action** — a server action is a real HTTP endpoint
with a generated name, so a layout check does not protect it.

---

## Security

| Concern | Mitigation |
| --- | --- |
| SQL injection | Drizzle parameterises everything. `%` and `_` in search input are escaped so they are literal, not wildcards |
| XSS | React escapes by default. `dangerouslySetInnerHTML` is used only for JSON-LD built from `JSON.stringify` of server data |
| CSRF | SameSite=Lax cookies; all mutations are POST/PATCH/DELETE; logout is POST-only |
| Broken authorisation | Every customer query is scoped by session id **in the WHERE clause**, not checked after loading. Another customer's address or order id matches no rows and 404s |
| Account enumeration | Login returns one message for both wrong-password and unknown-account, and runs a dummy bcrypt comparison so timing matches. Forgot-password always returns the same response |
| Brute force | Per-IP rate limits on login, register, reset, orders and contact |
| Privilege escalation | Separate JWT audiences; an admin cookie cannot open a customer API and vice versa — both verified by test |
| Data exposure | `admin_note` is stripped from every customer-facing query. Customer pages are `noindex` and `no-store` |
| Secret exposure | `server-only` fences secrets out of client bundles. Only `NEXT_PUBLIC_*` reaches the browser |
| Clickjacking / sniffing | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. `X-Powered-By` removed |
| Unsafe uploads | No upload endpoint exists. SVGs served through `next/image` get a CSP forbidding scripts and sandboxing the document |
| Error leakage | Every route wraps its handler; unexpected errors log server-side and return a generic message |

**Rate limiting is in-memory.** It protects a single instance. Behind more than
one server, swap the Map in `src/lib/rate-limit.ts` for Redis — the call sites
do not change.

---

## SEO

- Per-page titles and descriptions; product pages use admin-set overrides.
- Canonicals on every public page.
- Open Graph and Twitter card metadata.
- **Structured data**: `Store` sitewide, `Product` + `Offer` with honest
  availability, `BreadcrumbList` on every breadcrumb, `FAQPage`, and a `WebSite`
  SearchAction. Placeholder business values are **omitted**, not published.
- **No `aggregateRating`** — the shop has no verified reviews, and inventing
  them breaks Google's policy.
- `sitemap.xml` generated from live data; `robots.txt` blocks `/admin`,
  `/account`, `/cart`, `/checkout`, `/order-confirmation/` and `/api`.
- Semantic HTML: one `<h1>` per page, real `<table>` with `<caption>` and scope,
  `<nav>` with `aria-label`.

---

## Performance

- Server components mean the catalogue never ships to the browser. First-load JS
  is ~102 kB shared.
- **No N+1 queries.** Product grids fetch all images in one `IN` query; the
  orders list fetches all items in one query.
- `next/image` with an explicit `sizes`, AVIF/WebP, fixed aspect ratios to
  prevent layout shift, and `priority` only on the first row.
- The homepage is a single `Promise.all` of seven queries.
- System font stack — no web font download, no FOIT.
- Icons are inline SVG, so no icon library ships.

**Not measured**: no Lighthouse run was possible in the build environment.
Bundle sizes above are from the real production build; Core Web Vitals should be
checked against the deployed site.

---

## Deployment

1. Set every variable from `.env.example` in your host's environment. Fresh
   `AUTH_SECRET`, real `NEXT_PUBLIC_SITE_URL`.
2. `npm run build && npm start`.
3. **HTTPS is required** — session cookies are `secure` in production.
4. Run `npm run db:push` once against the production database.
5. Back up the database on a schedule. It holds every order.

### Deploying to Vercel with Turso

Vercel's filesystem is read-only and ephemeral, so a local SQLite file cannot
live there. Turso is hosted libSQL — the same engine — so this needs no code
change, only configuration.

1. Create a Turso database. It gives you a `libsql://...` URL and an auth token.
2. Create the tables and load data **from your machine**, pointed at Turso:
   ```bash
   DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="..." npm run db:push
   DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="..." npm run db:seed
   ```
3. In Vercel → Settings → Environment Variables, set at minimum:
   `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET` (a **new** one, not your
   local value), `NEXT_PUBLIC_SITE_URL` (your real deployment URL), and
   `NEXT_PUBLIC_BUSINESS_WHATSAPP`.
4. Redeploy.

Note that `/sitemap.xml` is the only route rendered during `next build`. It is
written to tolerate an unreachable database and fall back to the static pages,
so a first deploy succeeds before the database exists — but check the build log
for the warning, because it means product URLs are missing from the sitemap
until the next hourly regeneration.

Vercel's **Hobby plan forbids commercial use**. A shop taking real orders needs
Pro, or one of the hosts below.

### A caveat about SQLite and serverless hosts

Vercel and similar platforms have a read-only filesystem and ephemeral
instances. A SQLite file there will not persist. Options:

- Point `DATABASE_URL` at **Turso** (hosted libSQL) — no code change at all,
  just a URL and auth token
- Migrate to **PostgreSQL** (Neon, Supabase, RDS) — see above
- Deploy to a VPS with a persistent disk, where the file is fine

---

## Extending it later

The groundwork is deliberately in place for:

- **M-Pesa Daraja** — credentials already read in `src/lib/env.server.ts` with an
  `isConfigured` guard. Add an STK push call after order creation and a callback
  route that verifies server-side and sets `payment_status`. Never trust the
  callback body alone; re-query the transaction.
- **Email / SMS** — one function to change in the forgot-password route, plus
  order status notifications hooked into `updateOrderStatusAction`.
- **Push notifications** — service worker is registered; add a subscriptions
  table, VAPID keys and a `push` listener.
- **Reviews** — `testimonials` exists with `is_published`; add a customer-facing
  submission form and moderation screen.
- **Discount codes** — `orders.discount_cents` already exists.
- **Multiple branches** — add a `branch_id` to products, stock and orders.
