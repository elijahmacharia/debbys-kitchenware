# scripts

## smoke-test.mjs

An end-to-end test suite that drives the real HTTP surface of a running site —
no mocks. It exercises the public pages, search, filters, guest checkout, price
tampering, customer accounts, cross-account authorisation, the admin dashboard,
SEO output, the PWA manifest and service worker, security headers and error
handling.

Run it against a **production build with a freshly seeded database**:

```bash
npm run build
npm start &          # or in another terminal
npm run test:smoke
```

It expects the site at `http://localhost:3000` and the seeded admin password
`ChangeMe!2026`. Change the constant at the top if yours differs.

It creates real records — test orders, customers and addresses. Run it against a
development database, never production.
