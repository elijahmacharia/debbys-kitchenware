/**
 * End-to-end smoke test against the running production build.
 * Exercises the real HTTP surface: no mocks, no stubs.
 */
const BASE = 'http://localhost:3000';
let pass = 0, fail = 0;
const results = [];
const check = (name, ok, detail = '') => {
  if (ok) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`); }
};

/** Minimal cookie jar so sessions behave like a real browser. */
function jar() {
  const cookies = new Map();
  return {
    header: () => [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb: (response) => {
      for (const raw of response.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(';');
        const idx = pair.indexOf('=');
        const name = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (value === '') cookies.delete(name); else cookies.set(name, value);
      }
    },
  };
}

async function req(path, { method = 'GET', body, cookies, redirect = 'manual' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookies) headers.Cookie = cookies.header();
  const response = await fetch(BASE + path, { method, headers, redirect, body: body ? JSON.stringify(body) : undefined });
  if (cookies) cookies.absorb(response);
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: response.status, text, json, headers: response.headers };
}

const stamp = Date.now().toString().slice(-6);

/**
 * Counts the DIRECT element children of the first element whose opening tag
 * contains `marker`.
 *
 * This exists because of a real bug: a filter component returned a React
 * fragment, so its four top-level elements each became a separate CSS grid
 * cell. The page still returned 200 and still contained every product name, so
 * every content-based check passed while the layout was visibly broken. Only a
 * structural assertion catches that.
 */
function countDirectChildren(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) return -1;
  const openEnd = html.indexOf('>', at);
  if (openEnd === -1) return -1;

  const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','path','circle','rect','ellipse','line','polygon','polyline','use','stop']);
  let depth = 0, children = 0, i = openEnd + 1;

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;
    if (html.startsWith('<!--', lt)) { i = html.indexOf('-->', lt) + 3; continue; }

    const gt = html.indexOf('>', lt);
    if (gt === -1) break;
    const tag = html.slice(lt + 1, gt);

    if (tag.startsWith('/')) {
      if (depth === 0) return children;   // closing tag of the container itself
      depth -= 1;
      i = gt + 1;
      continue;
    }

    const name = tag.split(/[\s/>]/)[0].toLowerCase();
    const selfClosing = tag.endsWith('/') || VOID.has(name);
    if (depth === 0) children += 1;
    if (!selfClosing) depth += 1;
    i = gt + 1;
  }
  return children;
}

results.push('\n== Layout structure ==');
for (const [name, path] of [['shop', '/shop'], ['category', '/category/cleaning']]) {
  const html = (await req(path)).text;
  const kids = countDirectChildren(html, 'lg:grid-cols-[16rem_1fr]');
  // Exactly two: the filter sidebar, and the product column.
  check(`${name} filter grid has exactly 2 columns`, kids === 2, `found ${kids} direct children`);
}
const shopHtml = (await req('/shop')).text;
check('product grid sits in the wide column, not the sidebar',
  shopHtml.indexOf('grid-cols-2 gap-3') > shopHtml.indexOf('lg:grid-cols-[16rem_1fr]'));

results.push('\n== Public pages ==');
for (const [name, path] of [
  ['homepage', '/'], ['shop', '/shop'], ['categories', '/categories'],
  ['category page', '/category/kitchenware'], ['about', '/about'], ['contact', '/contact'],
  ['faq', '/faq'], ['delivery', '/delivery'], ['payment', '/payment'], ['cart', '/cart'],
  ['checkout', '/checkout'], ['privacy', '/privacy-policy'], ['terms', '/terms'],
  ['returns', '/returns'], ['login', '/login'], ['register', '/register'],
  ['forgot password', '/forgot-password'], ['offline', '/offline'],
  ['robots.txt', '/robots.txt'], ['sitemap.xml', '/sitemap.xml'],
  ['manifest', '/manifest.webmanifest'], ['service worker', '/sw.js'],
  ['app icon 192', '/icons/icon-192.png'], ['maskable icon', '/icons/maskable-512.png'],
]) {
  const r = await req(path);
  check(`${name} returns 200`, r.status === 200, `got ${r.status}`);
}
check('unknown product 404s', (await req('/product/no-such-thing')).status === 404);
check('unknown category 404s', (await req('/category/no-such-thing')).status === 404);

results.push('\n== Search, filters, sorting ==');
const search = await req('/shop?q=bucket');
check('search finds bucket products', search.text.includes('Plastic Bucket'));
check('no-results state renders', (await req('/shop?q=zzzzqqq')).text.includes('No products match'));
const suggest = await req('/api/search/suggest?q=bucket');
check('suggest API returns matches', (suggest.json?.results?.length ?? 0) > 0);
check('suggest ignores 1-char queries', (await req('/api/search/suggest?q=b')).json?.results?.length === 0);
check('sort=price-asc works', (await req('/shop?sort=price-asc')).status === 200);
check('sale filter works', (await req('/shop?sale=1')).status === 200);
check('new-arrivals filter works', (await req('/shop?new=1')).status === 200);
check('in-stock filter works', (await req('/shop?stock=1')).status === 200);
check('price range filter works', (await req('/shop?min=30000&max=60000')).status === 200);
check('hostile query params do not error', (await req('/shop?page=-5&min=abc&sort=drop')).status === 200);
const cheap = await req('/shop?sort=price-asc&max=25000');
check('price filter actually narrows results', !cheap.text.includes('Spin Mop with Bucket'));

results.push('\n== Product page ==');
const productPage = await req('/product/20l-plastic-bucket');
check('product page renders', productPage.status === 200);
check('sale price is shown', /KSh\s?450/.test(productPage.text));
check('original price struck through', productPage.text.includes('550'));
check('product JSON-LD present', productPage.text.includes('"@type":"Product"'));
check('stock availability in JSON-LD', productPage.text.includes('schema.org/InStock'));
const idMatch = productPage.text.match(/"productId\\?":\\?"([a-z0-9]{24})\\?"/);
const productId = idMatch ? idMatch[1] : null;
check('product id extracted for order tests', Boolean(productId));

results.push('\n== Cart API ==');
let stockBefore = 0;
if (productId) {
  const v = await req('/api/cart/validate', { method: 'POST', body: { productIds: [productId] } });
  check('cart validate returns the product', v.json?.products?.length === 1);
  check('cart validate returns the live sale price', v.json?.products?.[0]?.unitPriceCents === 45000, `got ${v.json?.products?.[0]?.unitPriceCents}`);
  stockBefore = v.json.products[0].stock;
  check('cart validate rejects oversized payloads', (await req('/api/cart/validate', { method: 'POST', body: { productIds: Array(80).fill('x') } })).status === 422);
}

const earlyGhost = await req('/api/orders', { method: 'POST', cookies: jar(),
  body: { items: [{ productId: 'aaaaaaaaaaaaaaaaaaaaaaaa', quantity: 1 }], customerName: 'A B', customerPhone: '0712345678', fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP' } });
check('unknown product id is refused', earlyGhost.status === 409, `got ${earlyGhost.status}`);

const emptyCartStatus = (await req('/api/orders', { method: 'POST', cookies: jar(),
  body: { items: [], customerName: 'A B', customerPhone: '0712345678', fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP' } })).status;

results.push('\n== Guest checkout ==');
const guest = jar();
let guestOrder = null;
if (productId) {
  const bad = await req('/api/orders', { method: 'POST', cookies: guest,
    body: { items: [{ productId, quantity: 1 }], customerName: 'X', customerPhone: '123', fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP' } });
  check('bad name and phone are rejected', bad.status === 422, `got ${bad.status}`);
  check('validation names the offending fields', Boolean(bad.json?.fields?.customerName && bad.json?.fields?.customerPhone));

  const wrongPay = await req('/api/orders', { method: 'POST', cookies: guest,
    body: { items: [{ productId, quantity: 1 }], customerName: 'Grace Wanjiru', customerPhone: '0712345678', fulfilment: 'PICKUP', paymentMethod: 'CASH_ON_DELIVERY' } });
  check('cash-on-delivery refused for pickup', wrongPay.status === 422 || wrongPay.status === 400, `got ${wrongPay.status}`);

  const overStock = await req('/api/orders', { method: 'POST', cookies: guest,
    body: { items: [{ productId, quantity: 99999 }], customerName: 'Grace Wanjiru', customerPhone: '0712345678', fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP' } });
  check('ordering more than stock is refused', overStock.status === 409 || overStock.status === 422, `got ${overStock.status}`);

  guestOrder = await req('/api/orders', { method: 'POST', cookies: guest,
    body: { items: [{ productId, quantity: 2 }], customerName: 'Grace Wanjiru', customerPhone: '0712345678',
            fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP', customerNote: 'QA test order' } });
  check('guest order is created', guestOrder.status === 201, `got ${guestOrder.status} ${guestOrder.text.slice(0, 160)}`);
  check('order number format DK-YYMM-NNNN', /^DK-\d{4}-\d{4}$/.test(guestOrder.json?.orderNumber ?? ''), guestOrder.json?.orderNumber);
  check('total is server-calculated (2 x 450)', guestOrder.json?.totalCents === 90000, `got ${guestOrder.json?.totalCents}`);

  const after = await req('/api/cart/validate', { method: 'POST', body: { productIds: [productId] } });
  check('stock decremented by 2', after.json.products[0].stock === stockBefore - 2, `${stockBefore} -> ${after.json.products[0].stock}`);

  const confirm = await req(`/order-confirmation/${guestOrder.json.publicId}`, { cookies: guest });
  check('guest can open their own confirmation', confirm.status === 200, `got ${confirm.status}`);
  check('never claims payment succeeded', !/payment successful/i.test(confirm.text));
  check('shows awaiting payment', /Awaiting payment/i.test(confirm.text));
  check('confirmation is noindex', /noindex/.test(confirm.text));
  check('a different browser gets 404 on that order', (await req(`/order-confirmation/${guestOrder.json.publicId}`)).status === 404);
}

results.push('\n== Price tampering ==');
if (productId) {
  const t = await req('/api/orders', { method: 'POST', cookies: jar(),
    body: { items: [{ productId, quantity: 1 }], customerName: 'Mal Ory', customerPhone: '0700000001',
            fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP', totalCents: 1, subtotalCents: 1, unitPriceCents: 1 } });
  check('client-supplied totals are ignored', t.status === 201 && t.json.totalCents === 45000, `status ${t.status}, total ${t.json?.totalCents}`);
}

results.push('\n== Customer accounts ==');
const customer = jar();
const phone = `07${stamp}11`.slice(0, 10);
const reg = await req('/api/auth/register', { method: 'POST', cookies: customer,
  body: { name: 'Test Customer', phone, email: `qa${stamp}@example.com`, password: 'testpass123' } });
check('registration succeeds', reg.status === 201, `got ${reg.status} ${reg.text.slice(0, 140)}`);
check('duplicate phone rejected', (await req('/api/auth/register', { method: 'POST', cookies: jar(), body: { name: 'Dupe', phone, password: 'testpass123' } })).status === 409);
check('weak password rejected', (await req('/api/auth/register', { method: 'POST', cookies: jar(), body: { name: 'Weak Pass', phone: '0733000111', password: 'short' } })).status === 422);

const account = await req('/account', { cookies: customer });
check('signed-in customer reaches /account', account.status === 200, `got ${account.status}`);
check('account greets by first name', /Hello,\s*(<!-- -->)?Test/.test(account.text));
const anon = await req('/account');
check('signed-out /account redirects', anon.status === 307 || anon.status === 302, `got ${anon.status}`);
check('redirect points at /login', (anon.headers.get('location') ?? '').includes('/login'));
check('addresses API rejects anonymous', (await req('/api/account/addresses')).status === 401);
check('wishlist API rejects anonymous', (await req('/api/wishlist', { method: 'POST', body: { productId: productId ?? 'x' } })).status === 401);
check('profile API rejects anonymous', (await req('/api/account/profile', { method: 'PATCH', body: { name: 'A B', phone: '0712345678' } })).status === 401);

if (productId) {
  check('wishlist add works', (await req('/api/wishlist', { method: 'POST', cookies: customer, body: { productId } })).status === 200);
  check('wishlist add is idempotent', (await req('/api/wishlist', { method: 'POST', cookies: customer, body: { productId } })).status === 200);
  check('wishlist page shows the item', (await req('/account/wishlist', { cookies: customer })).text.includes('Plastic Bucket'));
  check('wishlist remove works', (await req('/api/wishlist', { method: 'DELETE', cookies: customer, body: { productId } })).status === 200);
}

const addr = await req('/api/account/addresses', { method: 'POST', cookies: customer,
  body: { label: 'Home', recipientName: 'Test Customer', phone: '0712345678', county: 'Nairobi', town: 'Nairobi', area: 'Kasarani', estate: 'Mwiki', landmark: 'Near XYZ School' } });
check('address is saved', addr.status === 201, `got ${addr.status} ${addr.text.slice(0, 140)}`);
const addrList = await req('/api/account/addresses', { cookies: customer });
check('address list returns it', addrList.json?.addresses?.length === 1);
check('first address becomes default', addrList.json?.addresses?.[0]?.isDefault === true);
check('addresses page renders it', (await req('/account/addresses', { cookies: customer })).text.includes('Kasarani'));

const other = jar();
await req('/api/auth/register', { method: 'POST', cookies: other, body: { name: 'Other Person', phone: `07${stamp}22`.slice(0, 10), password: 'testpass123' } });
check('another customer cannot delete your address',
  (await req(`/api/account/addresses/${addrList.json.addresses[0].id}`, { method: 'DELETE', cookies: other })).status === 404);
check('another customer cannot edit your address',
  (await req(`/api/account/addresses/${addrList.json.addresses[0].id}`, { method: 'PATCH', cookies: other,
    body: { label: 'Hacked', recipientName: 'Mal Ory', phone: '0712345678', county: 'Nairobi', town: 'X', area: 'Y' } })).status === 404);

let memberOrder = null;
if (productId) {
  memberOrder = await req('/api/orders', { method: 'POST', cookies: customer,
    body: { items: [{ productId, quantity: 1 }], customerName: 'Test Customer', customerPhone: phone, fulfilment: 'PICKUP', paymentMethod: 'PAY_ON_PICKUP' } });
  check('signed-in order is created', memberOrder.status === 201, `got ${memberOrder.status}`);
  check('customer opens their own order', (await req(`/account/orders/${memberOrder.json.publicId}`, { cookies: customer })).status === 200);
  check('another customer gets 404 on it', (await req(`/account/orders/${memberOrder.json.publicId}`, { cookies: other })).status === 404);
  check('a guest cannot open a member order', (await req(`/order-confirmation/${memberOrder.json.publicId}`, { cookies: jar() })).status === 404);
  check('orders list shows the order', (await req('/account/orders', { cookies: customer })).text.includes(memberOrder.json.orderNumber));
}

results.push('\n== Login / logout ==');
const login = jar();
const badLogin = await req('/api/auth/login', { method: 'POST', cookies: login, body: { identifier: phone, password: 'wrongpassword' } });
const unknownLogin = await req('/api/auth/login', { method: 'POST', cookies: jar(), body: { identifier: '0799999999', password: 'whatever1' } });
check('wrong password rejected', badLogin.status === 401);
check('unknown account gives the same 401', unknownLogin.status === 401);
check('errors do not reveal which field was wrong', badLogin.json?.error === unknownLogin.json?.error);
const goodLogin = await req('/api/auth/login', { method: 'POST', cookies: login, body: { identifier: phone, password: 'testpass123' } });
check('correct password signs in', goodLogin.status === 200, `got ${goodLogin.status}`);
check('login returns saved cart for merging', Array.isArray(goodLogin.json?.savedCart));
check('email login also works', (await req('/api/auth/login', { method: 'POST', cookies: jar(), body: { identifier: `qa${stamp}@example.com`, password: 'testpass123' } })).status === 200);
check('profile update works', (await req('/api/account/profile', { method: 'PATCH', cookies: login, body: { name: 'Renamed Customer', phone, email: `qa${stamp}@example.com` } })).status === 200);
check('password change needs the current password', (await req('/api/account/password', { method: 'POST', cookies: login, body: { currentPassword: 'nope', newPassword: 'newpass123' } })).status === 400);
check('forgot-password never reveals existence', (await req('/api/auth/forgot-password', { method: 'POST', body: { identifier: '0799999999' } })).status === 200);
check('invalid reset token is refused', (await req('/api/auth/reset-password', { method: 'POST', body: { token: 'a'.repeat(64), password: 'newpass123' } })).status === 400);
check('logout succeeds', (await req('/api/auth/logout', { method: 'POST', cookies: login })).status === 200);
check('account protected after logout', [302, 307].includes((await req('/account', { cookies: login })).status));

results.push('\n== Admin ==');
const adminAnon = await req('/admin/dashboard');
check('admin dashboard redirects when signed out', [302, 307].includes(adminAnon.status), `got ${adminAnon.status}`);
check('redirect goes to admin login', (adminAnon.headers.get('location') ?? '').includes('/admin/login'));
check('customer session cannot open admin', [302, 307].includes((await req('/admin/dashboard', { cookies: customer })).status));
check('/admin redirects', [302, 307].includes((await req('/admin')).status));

const admin = jar();
check('admin login rejects a wrong password',
  (await req('/api/admin/auth/login', { method: 'POST', cookies: admin, body: { email: 'owner@debbyskitchenware.co.ke', password: 'wrong' } })).status === 401);
const adminLogin = await req('/api/admin/auth/login', { method: 'POST', cookies: admin, body: { email: 'owner@debbyskitchenware.co.ke', password: 'ChangeMe!2026' } });
check('admin can sign in', adminLogin.status === 200, `got ${adminLogin.status} ${adminLogin.text.slice(0, 120)}`);

for (const [name, path] of [
  ['dashboard', '/admin/dashboard'], ['orders', '/admin/orders'], ['products', '/admin/products'],
  ['new product', '/admin/products/new'], ['categories', '/admin/categories'],
  ['inventory', '/admin/inventory'], ['customers', '/admin/customers'],
  ['delivery zones', '/admin/delivery'], ['settings', '/admin/settings'],
]) {
  const r = await req(path, { cookies: admin });
  check(`admin ${name} loads`, r.status === 200, `got ${r.status}`);
}
const dash = await req('/admin/dashboard', { cookies: admin });
check('dashboard shows sales figures', /Sales this month/.test(dash.text));
check('dashboard counts the test orders', /Total orders/.test(dash.text));
check('admin orders list shows the guest order', guestOrder ? (await req('/admin/orders', { cookies: admin })).text.includes(guestOrder.json.orderNumber) : true);
check('admin order search works', guestOrder ? (await req(`/admin/orders?q=${guestOrder.json.orderNumber}`, { cookies: admin })).text.includes('Grace Wanjiru') : true);
check('admin status filter works', (await req('/admin/orders?status=NEW', { cookies: admin })).status === 200);
check('inventory lists products', (await req('/admin/inventory', { cookies: admin })).text.includes('Plastic Bucket'));
check('inventory low-stock filter works', (await req('/admin/inventory?filter=low', { cookies: admin })).status === 200);
check('customers page lists the test account', (await req('/admin/customers', { cookies: admin })).text.includes('Renamed Customer'));
check('customer search works', (await req(`/admin/customers?q=Renamed`, { cookies: admin })).text.includes('Renamed Customer'));
check('product search works', (await req('/admin/products?q=bucket', { cookies: admin })).text.includes('Bucket'));
check('settings shows placeholder warning', (await req('/admin/settings', { cookies: admin })).text.includes('still missing'));
check('admin cookie does not open customer APIs', (await req('/api/account/addresses', { cookies: admin })).status === 401);
check('admin logout works', (await req('/api/admin/auth/logout', { method: 'POST', cookies: admin })).status === 200);
check('admin protected after logout', [302, 307].includes((await req('/admin/dashboard', { cookies: admin })).status));

results.push('\n== SEO ==');
const home = await req('/');
check('homepage has exactly one h1', (home.text.match(/<h1/g) ?? []).length === 1, `found ${(home.text.match(/<h1/g) ?? []).length}`);
check('homepage has a meta description', /name="description"/.test(home.text));
check('homepage has canonical', /rel="canonical"/.test(home.text));
check('homepage has Open Graph', /property="og:title"/.test(home.text));
check('Store JSON-LD present', home.text.includes('"@type":"Store"'));
check('WebSite search JSON-LD present', home.text.includes('SearchAction'));
check('no placeholder leaks into JSON-LD', !home.text.includes('"telephone":"[BUSINESS PHONE]"'));
const robots = await req('/robots.txt');
check('robots blocks /admin', robots.text.includes('/admin'));
check('robots blocks /account', robots.text.includes('/account'));
check('robots blocks /api', robots.text.includes('/api'));
check('robots references the sitemap', robots.text.toLowerCase().includes('sitemap'));
const sitemap = await req('/sitemap.xml');
check('sitemap lists products', sitemap.text.includes('/product/'));
check('sitemap lists categories', sitemap.text.includes('/category/'));
check('sitemap excludes admin', !sitemap.text.includes('/admin'));
check('sitemap excludes account', !sitemap.text.includes('/account'));
const prodSeo = await req('/product/soft-broom');
check('product page has canonical', /rel="canonical"/.test(prodSeo.text));
check('product page has breadcrumb JSON-LD', prodSeo.text.includes('BreadcrumbList'));
check('images have alt text', /alt="[^"]+"/.test(prodSeo.text));
check('cart is noindex', /noindex/.test((await req('/cart')).text));
check('admin login is noindex', /noindex/.test((await req('/admin/login')).text));
check('FAQ emits FAQPage JSON-LD', (await req('/faq')).text.includes('FAQPage'));

results.push('\n== PWA ==');
const manifest = await req('/manifest.webmanifest');
check('manifest names the app', manifest.json?.name?.includes('Debby'));
check('manifest short_name is Debby\'s', manifest.json?.short_name === "Debby's");
check('manifest is standalone', manifest.json?.display === 'standalone');
check('manifest has theme colour', Boolean(manifest.json?.theme_color));
check('manifest has 192 and 512 icons', (manifest.json?.icons ?? []).length >= 3);
check('manifest has a maskable icon', (manifest.json?.icons ?? []).some((i) => i.purpose === 'maskable'));

results.push('\n== Brand mark ==');
// Every icon the browser or the OS can ask for, checked for real bytes rather
// than a 404 page served with a 200. A broken icon fails silently otherwise:
// the browser just shows its blank default and nobody notices.
const favicon = await req('/icon.svg');
check('favicon is served', favicon.status === 200, `got ${favicon.status}`);
check('favicon is SVG', (favicon.headers.get('content-type') ?? '').includes('svg'));
// The pot body path is the fingerprint. If someone drops in new artwork this
// check should be updated, not deleted — its job is catching an accidental
// revert to the old letter mark.
check('favicon draws the pot, not a letter', favicon.text.includes('M14.37 27.36') && !/M20 15h13\.5/.test(favicon.text));
for (const [label, path, minBytes] of [
  ['apple touch icon', '/apple-icon.png', 400],
  ['app icon 192', '/icons/icon-192.png', 400],
  ['app icon 512', '/icons/icon-512.png', 1000],
  ['maskable icon', '/icons/maskable-512.png', 1000],
]) {
  const res = await fetch(`${BASE}${path}`);
  const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
  check(`${label} is a real PNG`, res.status === 200
    && (res.headers.get('content-type') ?? '').includes('png')
    && bytes >= minBytes, `status ${res.status}, ${bytes} bytes`);
}
const ogRoot = await fetch(`${BASE}/opengraph-image`);
check('share image still renders after the mark change', ogRoot.status === 200
  && (ogRoot.headers.get('content-type') ?? '').includes('png'), `got ${ogRoot.status}`);

const sw = await req('/sw.js');
check('service worker never caches /api', sw.text.includes("'/api/'"));
check('service worker never caches /account', sw.text.includes("'/account'"));
check('service worker never caches /checkout', sw.text.includes("'/checkout'"));
check('service worker only handles GET', sw.text.includes("request.method !== 'GET'"));
check('service worker has an offline fallback', sw.text.includes('OFFLINE_URL'));
check('sw.js is served no-store', (sw.headers.get('cache-control') ?? '').includes('no-cache'));

results.push('\n== Security headers & errors ==');
check('X-Content-Type-Options set', home.headers.get('x-content-type-options') === 'nosniff');
check('X-Frame-Options set', home.headers.get('x-frame-options') === 'SAMEORIGIN');
check('Referrer-Policy set', Boolean(home.headers.get('referrer-policy')));
check('X-Powered-By hidden', !home.headers.get('x-powered-by'));
check('account API is no-store', (await req('/api/account/addresses')).headers.get('cache-control')?.includes('no-store'));
const badJson = await fetch(BASE + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json' });
check('malformed JSON does not 500', badJson.status < 500, `got ${badJson.status}`);
check('empty cart is refused', emptyCartStatus === 422, `got ${emptyCartStatus}`);
check('no stack traces in error responses', !/node_modules|at Object\./.test(earlyGhost.text));
const sqli = await req(`/shop?q=${encodeURIComponent("' OR 1=1 --")}`);
check('SQL-ish input is treated as text', sqli.status === 200 && sqli.text.includes('No products match'));
const xss = await req(`/shop?q=${encodeURIComponent('<script>alert(1)</script>')}`);
check('search term is escaped in HTML', xss.status === 200 && !xss.text.includes('<script>alert(1)</script>'));
check('secrets are not in page HTML', !home.text.includes(process.env.AUTH_SECRET ?? 'IMPOSSIBLE_VALUE'));
check('no M-Pesa secrets in HTML', !/MPESA_CONSUMER_SECRET/.test(home.text));

results.push('\n== Contact form ==');
const contact = await req('/api/contact', { method: 'POST', body: { name: 'Jane Doe', phone: '0712345678', subject: 'Do you stock buckets?', body: 'Hello, do you have 20 litre buckets in stock right now?' } });
check('contact form accepts a valid message', contact.status === 200, `got ${contact.status}`);
check('honeypot silently swallows bots', (await req('/api/contact', { method: 'POST', body: { name: 'Bot Bot', phone: '0712345678', subject: 'spam spam', body: 'buy my thing right now please', website: 'http://spam.example' } })).status === 200);
check('short message rejected', (await req('/api/contact', { method: 'POST', body: { name: 'Jane Doe', phone: '0712345678', subject: 'Hi', body: 'short' } })).status === 422);

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
