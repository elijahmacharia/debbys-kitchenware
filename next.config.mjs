/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    imageSizes: [64, 96, 128, 200, 256, 384],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536],
    /*
     * The placeholder product images are SVG. Next refuses to optimise SVG by
     * default because an SVG can contain script. These three settings are the
     * documented way to allow it safely: the file is served with a restrictive
     * CSP that forbids scripts and sandboxes the document, so an uploaded SVG
     * cannot execute anything.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    ];
    return [
      { source: '/:path*', headers: security },
      // The service worker must never be cached or updates will not ship.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
      // Never let a shared cache hold authenticated JSON.
      { source: '/api/account/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};
export default nextConfig;
