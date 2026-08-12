# Debby's Kitchenware

A working e-commerce platform for a Kenyan kitchenware and household goods shop:
a public storefront, WhatsApp ordering, guest checkout, optional customer
accounts, an owner's admin dashboard, and an optional installable app.

> **The demo catalogue is placeholder data.** The 43 products, their prices and
> the delivery zones were invented to make the site usable before the real
> catalogue exists. Replace them in the admin dashboard before going live. See
> [Business information you must supply](#business-information-you-must-supply).

---

## Quick start

```bash
cp .env.example .env          # then edit it — see "Environment variables"
npm install
npm run setup                 # creates the database and loads the demo catalogue
npm run dev                   # http://localhost:3000
```

Sign in to the admin dashboard at `/admin/login` with the `SEED_ADMIN_EMAIL`
and `SEED_ADMIN_PASSWORD` you put in `.env`. **Change that password after your
first sign-in.**

Before running `npm run setup` you must set at least:

| Variable              | Why                                                     |
| --------------------- | ------------------------------------------------------- |
| `AUTH_SECRET`         | Signs session cookies. `openssl rand -base64 48`        |
| `SEED_ADMIN_PASSWORD` | Your first admin password, at least 8 characters        |

The seed refuses to run with a placeholder or short admin password.

---

## What it does

**For customers**

- Browse by category, search by name, SKU, description or keyword (including
  Swahili terms like *ndoo* or *sufuria*), filter by price, availability, sale
  and new arrivals, and sort six ways.
- Add to cart, change quantities, and check out **as a guest** — an account is
  never required.
- Choose shop pickup (free) or delivery, with a Kenyan address form built
  around county, town, area, estate and landmark rather than street numbers.
- Order on WhatsApp from any product, from the cart, or from checkout. The
  message is generated from the real cart contents.
- Track an order on a status timeline, with a link that works without an
  account.
- Optionally create an account for order history, saved addresses and a
  wishlist.
- Optionally install the site as an app. The website always works without it.

**For the owner**

- A dashboard with sales, order and stock figures.
- Full product management: create, edit, hide, delete, price, discount, stock,
  categories, featured/new flags and SEO fields.
- Category management with nesting and ordering.
- Inventory screen with low-stock and out-of-stock views and one-tap stock
  correction, with an audit trail of every change.
- Order management: search, filter by status, advance an order through its
  lifecycle, record M-Pesa payment, cancel (which returns stock), and message
  the customer on WhatsApp.
- Customer list, delivery zone and fee configuration, and editable site copy
  and policies.

---

## Technology

| Layer     | Choice                        | Why |
| --------- | ----------------------------- | --- |
| Framework | Next.js 15 (App Router)       | Server components keep the catalogue on the server; one deployable unit |
| Language  | TypeScript (strict)           | |
| Styling   | Tailwind CSS 3                | All colours resolve to CSS variables in `globals.css` for one-file rebranding |
| Database  | SQLite via libSQL             | See the note below |
| ORM       | Drizzle ORM                   | See the note below |
| Auth      | `jose` (JWT cookies) + bcrypt | No third-party auth service to configure or pay for |
| Validation| Zod                           | The same schemas run on the client and as the server-side gate |

### Two deliberate deviations from the brief

The brief asked for PostgreSQL and Prisma. Both were changed, for reasons worth
recording:

1. **Drizzle instead of Prisma.** Prisma's CLI downloads platform-specific
   engine binaries from `binaries.prisma.sh` at install time. That host was
   unreachable from the environment this was built in, so Prisma could not be
   generated, migrated or tested at all. Drizzle is pure TypeScript, needs no
   engine download, and produces plain SQL. Everything here was therefore
   actually run and tested rather than written blind.
2. **SQLite (libSQL) instead of PostgreSQL, as the default.** A single file
   needs no server, which means `npm install && npm run setup` works first time
   on any machine. The libSQL driver ships prebuilt binaries through npm, so
   there is no C++ toolchain requirement on Windows or macOS either. For a shop
   of this size SQLite is genuinely adequate — it will handle this catalogue and
   order volume comfortably.

**Moving to PostgreSQL** is a contained change, documented step by step in
[`docs/TECHNICAL.md`](docs/TECHNICAL.md#moving-to-postgresql). Only two files
change: the driver in `src/db/index.ts` and the column helpers in
`src/db/schema.ts`. No page, API route or query needs editing.

---

## Project structure

```
src/
  app/
    (storefront)/        Public shop — header, footer, cart, WhatsApp, PWA prompt
    (admin)/admin/       Staff dashboard — no shop chrome, no service worker
      actions.ts         Server actions; every one re-checks authorisation
    api/                 JSON endpoints for the browser
    layout.tsx           <html>, <body>, toasts. Deliberately thin
    manifest.ts          PWA manifest
    robots.ts            Crawler rules
    sitemap.ts           Generated from the live catalogue
  components/
    ui/                  Buttons, fields, alerts, badges, skeletons, pagination
    layout/              Header, footer, menus, search
    product/             Cards, gallery, buy box, wishlist, WhatsApp buttons
    cart/                Cart state, cart page, checkout form
    account/             Auth forms, account nav, addresses
    admin/               Admin shell, forms, tables
    order/               Order summary and status timeline
    pwa/                 Install prompt, service worker manager
    seo/                 JSON-LD structured data
  db/
    schema.ts            Every table, index and relation
    seed.ts              Demo catalogue loader
  lib/
    config.ts            Business info from env — the single source of truth
    auth.ts              Sessions, password hashing, guest order access
    validation.ts        Zod schemas shared by client and server
    money.ts             Integer-cents arithmetic and formatting
    whatsapp.ts          Message builders
    orders/createOrder.ts  The transaction that takes an order
    queries/             All database reads
public/
  icons/                 PWA icons (placeholders — see public/icons/README.md)
  sw.js                  Service worker
  uploads/               Where product photos go
```

---

## Environment variables

Every value lives in `.env`. `.env.example` documents all of them; the ones
that matter most:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` by default |
| `AUTH_SECRET` | yes | 32+ random characters. Server-side only |
| `NEXT_PUBLIC_SITE_URL` | yes | Your real domain in production; used for canonicals and the sitemap |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | for setup | Creates the first owner login |
| `NEXT_PUBLIC_BUSINESS_WHATSAPP` | to sell | Digits only, e.g. `254712345678`. **Without it every WhatsApp button disappears rather than breaking** |
| `NEXT_PUBLIC_BUSINESS_PHONE` / `_EMAIL` / `_ADDRESS` / `_HOURS` | recommended | Placeholder values are hidden from customers |
| `NEXT_PUBLIC_MPESA_TILL` / `_PAYBILL` | recommended | A blank method is hidden from checkout |
| `NEXT_PUBLIC_GOOGLE_MAPS_URL` / `_EMBED_URL` | optional | Blank hides the map instead of showing a wrong location |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Blank means no analytics script loads at all |
| `MPESA_*` | not used yet | Reserved for a future Daraja integration |

Anything prefixed `NEXT_PUBLIC_` is visible in the browser by design. Secrets
must never carry that prefix.

---

## Business information you must supply

The site is built so that missing information is **hidden**, never invented.
Until you provide these, customers simply do not see them:

- Phone number, WhatsApp number, email address
- Shop address and opening hours
- Google Maps location
- M-Pesa till or paybill number
- Social media links
- **Real product names, prices and stock** (currently demo data)
- **Real delivery fees** (all zones ship switched off with a zero fee)
- Returns policy specifics, privacy retention period, and legal review of the
  terms — each draft page lists exactly what is outstanding

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run typecheck` | TypeScript with no emit |
| `npm run setup` | Create the schema and load demo data |
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:generate` | Write a SQL migration file |
| `npm run db:seed` | Reload the demo catalogue (refuses if real orders exist; `-- --force` overrides) |
| `npm run db:studio` | Browse the database in a GUI |

---

## Deployment

1. Set every variable from `.env.example` in your host's environment. Use a new
   `AUTH_SECRET` for production and set `NEXT_PUBLIC_SITE_URL` to the real
   domain.
2. `npm run build`, then `npm start`.
3. Serve over HTTPS. Session cookies are marked `secure` in production and will
   not be sent over plain HTTP.
4. Run `npm run db:push` once against the production database, then seed only
   if you want the demo catalogue there.
5. Back up the database file (or your Postgres instance) on a schedule. It holds
   every order.

Full deployment notes, including the Vercel caveat about SQLite on a read-only
filesystem, are in [`docs/TECHNICAL.md`](docs/TECHNICAL.md#deployment).

---

## Documentation

- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) — running the shop, in plain language
- [`docs/CUSTOMER_GUIDE.md`](docs/CUSTOMER_GUIDE.md) — what customers can do
- [`docs/PWA.md`](docs/PWA.md) — installing, offline behaviour, updates, icons
- [`docs/TECHNICAL.md`](docs/TECHNICAL.md) — architecture, database, API, security, Postgres migration
- [`docs/TESTING.md`](docs/TESTING.md) — what was tested, and what was not
