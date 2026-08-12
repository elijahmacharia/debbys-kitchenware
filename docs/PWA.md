# The installable app (PWA)

The site is a Progressive Web App. Customers can add it to their home screen and
it opens like an app — no app store, no download.

**The website comes first.** The app is an enhancement layered on top. Every
feature works identically in a normal browser tab, and nothing on the site
requires or nags for installation.

---

## How customers install it

### Android — Chrome, Edge, Samsung Internet

The browser fires an install event once it decides the site qualifies. We
intercept it, wait, and show our own card instead of Chrome's mini-infobar.

Customers can also install manually: browser menu → **Install app** / **Add to
Home screen**.

### iPhone and iPad — Safari

Safari exposes no installation API. Rather than show a button that would do
nothing, iOS users get the actual steps:

1. Tap **Share**
2. Choose **Add to Home Screen**
3. Tap **Add**

### Desktop — Chrome, Edge, ChromeOS

An install icon appears in the address bar. Installed, it opens in its own
window with no browser chrome.

---

## The install prompt

Deliberate rules, all enforced in `src/components/pwa/InstallPrompt.tsx`:

| Rule | Why |
| --- | --- |
| Never a modal or full-screen interstitial | Blocking a shopper to advertise an app costs orders |
| Appears only after 25 seconds | Nobody installs an app they have not looked at yet |
| "Maybe later" is remembered for 30 days | Asking again tomorrow is nagging |
| Hidden entirely if already installed | Detected via `display-mode: standalone` and Safari's `navigator.standalone` |
| Hidden entirely if the browser cannot install | No dead buttons |
| iOS gets instructions, not a button | The API does not exist there |

---

## Offline behaviour

The service worker (`public/sw.js`) is intentionally conservative.

**Cached:**

- The offline page, manifest and app icons
- Build output under `/_next/static/` — content-hashed, so it can never go stale
- Images, capped at 60 entries so the cache cannot grow without bound
- Recently visited pages, network-first with a cap of 30

**Never cached, by design:**

- Anything under `/api`, `/account`, `/admin`, `/checkout`, `/cart` or
  `/order-confirmation`

That second list is the important one. Those paths carry names, phone numbers,
addresses and order history. Caching them would leave personal data sitting on a
shared or stolen phone, and would risk showing a stale price or stock figure at
the exact moment of purchase. Non-GET requests are never intercepted either, so
an order always goes to the network or fails loudly.

**When a page cannot be reached**, the customer sees the offline page: "You're
offline", an explanation, and a **Try again** button. It never suggests an order
went through — offline means the server was never reached.

---

## Updates

A new version is **never** activated automatically. Swapping the service worker
mid-session can reload the page while somebody is halfway through checkout.

Instead a small card appears: *"A new version is available"* with **Update** and
**Not now**. Update applies it and reloads; Not now dismisses until next visit.

---

## Icons

`public/icons/` currently holds **placeholders** — a white "D" on the brand
green. They are real, valid PNGs, so the app is installable today, but they are
not a logo.

To replace them, export the real logo at these sizes and overwrite the files,
keeping the names:

| File | Size | Notes |
| --- | --- | --- |
| `icon-192.png` | 192×192 | What most Android launchers use |
| `icon-512.png` | 512×512 | Splash screens and app listings |
| `maskable-512.png` | 512×512 | **Keep the logo inside the middle 80%** — Android crops this to a circle or squircle |

No code change is needed; `src/app/manifest.ts` already points at these paths.

---

## App identity

| Setting | Value |
| --- | --- |
| Name | Debby's Kitchenware |
| Short name | Debby's |
| Start URL | `/?source=pwa` |
| Display | standalone |
| Theme colour | `#1f6b52` |
| Background | `#f9faf9` |
| Shortcuts | Shop, My orders, Cart |

---

## Same site, same account

The app and the website are the same application. Same server, same database,
same products, same cart logic, same login. A customer who signs in on the
website is signed in in the app, and sees the same order history. There is no
separate app account.

**The owner does not need the app.** The admin dashboard is a normal web page,
and the service worker is deliberately not registered anywhere under `/admin` —
staff data is never cached offline.

---

## Push notifications

Not implemented, and no permission is ever requested.

The groundwork is there — the service worker is registered and order status
changes already flow through one place (`updateOrderStatusAction`) — so adding
them later means adding a push subscription table, VAPID keys and a `push`
event listener. Until that backend exists, asking a customer for notification
permission would be asking for something we cannot deliver.
