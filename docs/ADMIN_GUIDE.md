# Running the shop — a guide for Debby

This explains everything you can do in the dashboard. No technical knowledge is
assumed. If something here does not match what you see on screen, tell your
developer — the guide should always match the site.

---

## Signing in

Go to **yoursite.com/admin/login** and enter your email and password.

- Your session lasts **8 hours**, then you sign in again. This is deliberate: if
  you leave the shop laptop open, it locks itself out by the end of the day.
- After five wrong password attempts you have to wait 15 minutes. This is what
  stops someone guessing their way in.
- Customers cannot reach any of these pages, even if they are signed in to a
  shopping account. It is a completely separate login.

**Change the starting password immediately.** Ask your developer to update
`SEED_ADMIN_PASSWORD` and reseed, or to add a fresh admin account for you.

---

## The dashboard

The first page shows how the shop is doing:

- **Sales this month / all time** — only counts orders you have marked
  *Delivered*. Orders that were placed but never completed are not included,
  because counting them would flatter the number and mislead you.
- **Awaiting action** — orders that are not yet delivered or cancelled. If this
  is above zero, someone is waiting on you.
- **Low stock / out of stock** — click through to fix them.
- **Most popular products** — by units sold, then by how often the page was
  viewed. Useful for deciding what to restock.

---

## Products

### Adding a product

**Products → Add product.**

| Field | What to put |
| --- | --- |
| Product name | What a customer would call it. "20L Plastic Bucket", not "BUCKET-BLUE-20" |
| SKU | Your own code. Must be unique. Used on order slips |
| Category | Which department it belongs in. Create the category first if it does not exist |
| Description | What it is, what size, what it is good for. This is what convinces someone to buy |
| Search keywords | Other words people might type, **including Swahili** — *ndoo*, *sufuria*, *beseni*, *ufagio*. Comma separated. This genuinely improves how findable the product is |
| Price | Just the number: `450` or `450.50` |
| Sale price | Leave blank unless it really is reduced. Must be lower than the normal price — the form will not let you fake a discount |
| Stock | How many you have |
| Warn me at | When stock drops to this number the product is flagged as low |
| Sold by | each, pack, set, dozen |

### Photos

Photo upload through the dashboard is **not built yet**. For now:

1. Give the photo a descriptive filename, e.g. `20l-plastic-bucket-blue.jpg`
   (this helps Google Images find it).
2. Ask your developer to place it in the `public/uploads/` folder.
3. In the product form, enter the path: `/uploads/20l-plastic-bucket-blue.jpg`
4. Fill in the **alt text** — a short description of what is in the photo. Blind
   customers' screen readers read it aloud, and Google uses it too.

The first photo is the one shown on product cards.

### Visibility

- **Visible in the shop** — untick to hide a product without losing it or its
  sales history. Use this for seasonal items or something temporarily
  unavailable.
- **Featured on the homepage** — appears in the Featured section.
- **Show in New arrivals** — appears in the New arrivals section.

### Deleting

If a product has **never been ordered**, deleting removes it completely.

If it **has been ordered**, the system hides it instead of deleting it, and
tells you so. This is intentional: deleting it outright would corrupt the record
of what you sold last month.

---

## Categories

**Categories** shows your departments and their subcategories.

- Use the **↑ ↓** buttons to change the order customers see.
- A category can sit inside another one — "Buckets" inside "Plastic Products".
- A category holding products **cannot be deleted** until you move those
  products elsewhere. Untick "Visible in the shop" to hide it instead.
- The description you write appears at the top of the category page and is used
  by Google.

---

## Inventory

**Inventory** is the fastest way to correct stock after a count.

Type the number you actually counted on the shelf into the box and press
**Set**. The system works out the difference and records it, so months later you
can still see how a figure got where it is.

Three tabs: **All**, **Low stock**, **Out of stock**.

Out-of-stock products stay visible to customers but cannot be added to a cart —
they show "Out of stock" instead. Customers can still ask about them on
WhatsApp, which is often how you find out something is worth restocking.

---

## Orders

### The lifecycle

```
Order placed → Confirmed → Being packed → Out for delivery → Delivered
                                        ↘ Ready for pickup ↗
```

The customer sees this as a timeline. A pickup order never shows "Out for
delivery", and a delivery order never shows "Ready for pickup".

You can only move an order **forwards**, or cancel it. A delivered order cannot
be pushed back to "Being packed" — that would make your records untrue.

### Handling an order

1. It arrives as **Order placed**. The customer has been told it is not yet
   confirmed or paid.
2. Check you have the stock and, for delivery, that you can reach the area.
3. Call or WhatsApp the customer — the **Message customer** button opens a chat
   with their order number already typed.
4. Mark it **Confirmed**.
5. Pack it, mark it **Being packed**.
6. Mark it **Ready for pickup** or **Out for delivery**.
7. When it is handed over, mark it **Delivered**. That is when it counts towards
   your sales figures.

### Recording payment

The website **never** marks an order as paid by itself. Only you can, and only
after you have actually seen the M-Pesa message.

In the **Payment** box: set the status to *Paid* and paste the M-Pesa
transaction code. The code is your proof if there is ever a dispute.

### Cancelling

Cancelling **returns the items to stock automatically** and records why. Add a
note explaining the reason — the customer sees it on their timeline, so
"Item damaged in storage, refund sent" is much better than nothing.

### Internal notes

The **Internal note** box is staff-only. The customer never sees it. Use it for
things like "Customer asked us to call before 6pm".

---

## Customers

People who created an account. Guests who ordered without one appear on the
orders page instead.

You can see name, phone, email, how many orders they have placed and what they
have spent. Click the order count to see their orders.

**You cannot see anyone's password, and neither can your developer.** Passwords
are stored scrambled in a way that cannot be reversed. If a customer is locked
out, they use "Forgot your password" — or you contact them directly.

---

## Delivery zones

This is where you decide **what delivery costs**. The system deliberately ships
with every zone switched **off** and a fee of zero, because only you can decide
what delivery to each area is worth.

For each area set:

- **Area name** — what customers will recognise: "Kasarani", not "Zone 3"
- **County**
- **Delivery fee** — the number in shillings. **Enter 0** if you would rather
  agree the price on WhatsApp; customers then see "fee confirmed with you" and
  the total shown to them excludes it
- **Estimated time** — "Same day", "1-2 days"
- **Offer this area at checkout** — tick this and customers can choose it

Only ticked zones appear at checkout. If no zone is ticked, the delivery option
is disabled and customers can only choose pickup — which is the honest outcome
if you have not set delivery up yet.

---

## Settings

Two kinds of setting, and the difference matters.

**Text you can edit** (saved instantly, no developer needed):

- Announcement bar — the strip at the top of every page. Leave it blank to hide
  it. **It currently says the catalogue is demo data — clear it when you go
  live.**
- Delivery notice shown at checkout
- Extra payment instructions
- Returns policy, privacy policy, terms — whatever you write here replaces the
  draft version and removes its "needs review" warning
- Extra paragraph for the About page

**Business details** (phone, WhatsApp, address, hours, M-Pesa numbers) are
shown read-only. They are set once in a configuration file at deploy time, which
keeps them out of the browser and out of reach of anyone who gets into the
dashboard. Ask your developer to change them.

If the page warns that details are missing, those are still placeholders. They
are **hidden from customers** until filled in, so nothing wrong is on display —
but the WhatsApp buttons will not appear until the WhatsApp number is set.

---

## Before you go live

- [ ] Change the admin password
- [ ] Set the WhatsApp number, phone, email, shop address and opening hours
- [ ] Set the M-Pesa till or paybill
- [ ] Delete the demo products and add your real ones
- [ ] Set real delivery fees and switch on the zones you serve
- [ ] Clear the "demo catalogue" announcement
- [ ] Write or approve the returns, privacy and terms pages
- [ ] Add real product photos
- [ ] Replace the placeholder app icons with your logo
