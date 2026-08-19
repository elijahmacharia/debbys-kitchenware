# What was tested, and what was not

Being specific about this matters more than a green tick. Below is exactly what
was exercised, how, and what remains unverified.

---

## Automated end-to-end suite

**178 checks, all passing.** Run against a real production build (`next build`
then `next start`) with a seeded database, driving the actual HTTP surface with
a cookie jar — no mocks, no stubs, no test doubles.

| Area | Checks | What was verified |
| --- | --- | --- |
| Public pages | 26 | All 24 routes return 200; unknown product and category slugs return 404 |
| Search, filters, sorting | 12 | Real matches for "bucket"; empty state; typeahead; every filter and sort; price filter demonstrably narrows results; hostile query strings (`?page=-5&min=abc&sort=drop`) do not error |
| Product page | 6 | Sale price shown, original struck through, JSON-LD with honest stock availability |
| Cart API | 3 | Live price and stock returned; oversized payloads rejected |
| Guest checkout | 17 | Invalid name/phone rejected with per-field errors; wrong payment method for fulfilment type rejected; over-stock refused; order created; order number format; **server-calculated total**; **stock decremented**; guest can open own confirmation; a different browser gets 404 |
| Price tampering | 1 | A request claiming `totalCents: 1` was charged the real KSh 450 |
| Customer accounts | 25 | Registration, duplicate rejection, weak-password rejection, protected routes, wishlist add/remove/idempotency, addresses CRUD, default-address logic |
| Authorisation | 6 | **Another customer cannot read, edit or delete your address or order** — all return 404. A guest cannot open a member's order |
| Login/logout | 12 | Wrong password and unknown account return an identical message; phone and email login; profile update; password change requires the current one; logout invalidates |
| Admin | 29 | Signed-out redirect; **a customer session cannot open the admin area**; wrong password rejected; all 9 dashboard pages load; search and filters work; **an admin cookie cannot open customer APIs** |
| SEO | 21 | One `<h1>`; description, canonical, Open Graph; Store, WebSite, Product, Breadcrumb and FAQ JSON-LD; robots blocks admin/account/api; sitemap includes products and categories and excludes private routes; cart and admin are noindex |
| PWA | 12 | Manifest name, short name, standalone, theme colour, 192/512/maskable icons; service worker refuses to cache `/api`, `/account`, `/checkout`; GET-only; offline fallback; `sw.js` served no-store |
| Security headers & errors | 13 | nosniff, SAMEORIGIN, Referrer-Policy, no X-Powered-By, account API no-store; malformed JSON does not 500; empty cart refused; unknown product id refused; **no stack traces in responses**; SQL-ish input treated as literal text; search term escaped in HTML; no secrets in page source |
| Contact form | 3 | Valid message accepted; honeypot silently swallows bots; short message rejected |
| Layout structure | 3 | The shop and category filter grids have exactly two direct children, and the product grid sits in the wide column rather than the sidebar |

The suite also confirms the two most important commercial guarantees:
**the site never claims a payment succeeded**, and **the total always comes from
the database**.

---

## Accounts, Google sign-in and payments (August 2026)

The signup form changed to email and password only, phone moved to checkout,
and Google sign-in was added. 220 checks pass against a real production build.
What that run actually proves, and what it does not:

**Proven by the suite**

- Signing up with an email and password returns 201, and no longer asks for a
  name or a phone number.
- A duplicate email returns 409 with wording that sends the person to sign in.
  A weak password and a malformed email both return 422.
- Sign-in works by email. It also works by phone once a phone has been added on
  the profile page, so accounts made before this change still work.
- The account page greets someone with no name using the part of their email
  before the @, rather than showing a blank.
- `/login`, `/register` and `/forgot-password` render with no header and no
  footer, while `/shop` still has both. Each auth page still shows the shop name
  and a link back to the shop, so nobody is stranded.
- With Google unconfigured, the button is not rendered, `/api/auth/google`
  redirects with an explanation instead of erroring, and a forged callback is
  refused without setting a session cookie.
- Every unpaid order in the admin list has a Mark paid button, paid orders have
  none, and the paid and unpaid filters return sets that do not overlap.
- `?new=1` opens the new-category form; without it the form stays closed.

**NOT proven, and worth knowing**

- **A real Google sign-in has never been completed.** The sandbox has no Google
  credentials, so only the unconfigured paths are covered. The first live
  attempt is the first real test, and `redirect_uri_mismatch` is the usual
  first failure — the URI in Google Cloud must match
  `https://YOUR-DOMAIN/api/auth/google/callback` exactly.
- **The Mark paid button was never pressed.** Server actions cannot be driven
  over plain HTTP, so the suite proves the button appears for the right orders,
  not that pressing it updates the row. Press it once on a test order.
- Nothing visual was checked. No screenshots, no browsers, no screen readers.
- Account linking, where someone signs up by email and later uses Google with
  the same address, is written and typechecked but never exercised.

**Migration warning**

`npm run db:push` fails against a database that already has the old customers
table: `no such column: google_id`. SQLite cannot add a unique column and
change three others to nullable in place. On an empty database the push works
cleanly. Since the shop is not trading yet, dropping the customers table and
pushing again is the simple fix — but check the table is genuinely empty first,
because that deletes every account in it.

## Bugs the suite found, and the fixes

Worth recording, because they are exactly the class of bug that ships silently.

1. **Search was completely broken.** `ESCAPE '\'` inside a JavaScript template
   literal was parsed as an escaped quote, producing `ESCAPE ''` — an invalid
   empty escape character. Every search query threw. Fixed by doubling the
   backslash in all 12 occurrences across `products.ts` and `admin.ts`.
   *This is why search was tested with a real query rather than a 200 check.*

2. **The admin products page returned a 500.** A server component was passing
   inline `async () => action(id)` closures to a client component. React cannot
   serialise those. Fixed by moving the row buttons into
   `ProductRowActions`, a client component that imports the server actions
   itself.

3. **The contact honeypot was not silent.** A filled honeypot returned a 422
   validation error, which tells a bot precisely which field caught it. Fixed so
   the field accepts any value and the route returns a normal success message.

4. **The shop and category pages were laid out wrongly** — found by the client,
   not by the suite. `ShopFilters` returned a React fragment, so its four
   top-level elements each became a separate CSS grid cell: the filter panel
   landed in the products column and the product grid was squeezed into the
   16rem sidebar, crushing every card. The page still returned 200 and still
   contained every product name, so **every content-based check passed while the
   page was visibly broken**. Fixed by returning a single wrapper element, and a
   new structural assertion (`countDirectChildren`) now counts the grid's direct
   children so this class of bug cannot pass again.

5. **The order rate limiter worked too well** — it correctly blocked the test
   suite's later order attempts. Test reordered; the limiter was left alone.

---

## Also verified manually

- `npm run build` completes with no TypeScript or lint errors.
- `tsc --noEmit` passes in strict mode.
- `npm run setup` on an empty database creates the schema, 21 categories, 43
  products with generated placeholder images, and 8 delivery zones.
- The seed refuses to run against a database containing real orders unless
  `--force` is passed.
- The seed refuses a placeholder or short admin password.
- Placeholder business values are genuinely hidden — the footer, contact page
  and JSON-LD omit them rather than printing `[BUSINESS PHONE]`.

---

## NOT tested — be aware of these

Honesty about coverage is more useful than a claim of completeness.

**No real browser was available in the build environment**, so everything below
is unverified by execution:

| Not tested | Risk | How to check |
| --- | --- | --- |
| Visual appearance | Layout could be wrong despite correct HTML — **this already happened once**, see bug 4 above | Open it and look, at 320/375/414/768/1024/1440px |
| Responsive behaviour | Written mobile-first with `overflow-x: hidden` and 44px targets, but never rendered | Chrome DevTools device toolbar |
| JavaScript interactions | Cart buttons, quantity steppers, filters, mobile menu, dropdowns — logic reviewed, never clicked | Manual pass through the checklist in the README |
| PWA installation | Manifest and service worker are correct by inspection; the install flow was never run | Chrome DevTools → Application → Manifest; Lighthouse PWA audit |
| Offline mode | Caching rules verified by reading `sw.js`, never exercised | DevTools → Network → Offline |
| Service worker updates | The update card has never been seen | Deploy twice and watch |
| Cross-browser | Chrome, Firefox, Safari, Edge — none opened | Especially mobile Safari |
| Screen readers | ARIA, labels, roles and focus order were written deliberately; never heard | VoiceOver or NVDA |
| Colour contrast | Calculated, not measured | axe DevTools or Lighthouse |
| Lighthouse / Core Web Vitals | Bundle sizes are from the real build; field metrics unknown | Run against the deployed site |
| Load and concurrency | The conditional-decrement stock guard is correct by construction; two truly simultaneous purchases of the last item were never raced | A concurrency test, or accept the design |
| Password reset end to end | Token generation, hashing, expiry and single-use are tested; delivery is not implemented at all | Wire up email or SMS first |
| Email and SMS | Not implemented | — |
| M-Pesa | Not implemented | — |

---

## Recommended before going live

1. Click through every page on a real phone. The mobile experience is the one
   that matters most here and it is the one that has not been seen.
2. Run Lighthouse on the deployed site — performance, accessibility, SEO and
   PWA.
3. Install the app on an Android phone and an iPhone and place a test order from
   each.
4. Place one real order end to end, including paying by M-Pesa and marking it
   paid in the dashboard.
5. Test the offline page by turning off mobile data mid-browse.
6. Have someone who is not you try to buy something, and watch without helping.
