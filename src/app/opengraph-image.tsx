import { ImageResponse } from 'next/og';
import { business } from '@/lib/config';

/**
 * The picture that appears when someone shares a link to this site on
 * WhatsApp, Facebook or X.
 *
 * Generated as a PNG at request time rather than served as a static file,
 * because social scrapers do not render SVG — which is why sharing a link
 * previously showed no image at all.
 *
 * 1200x630 is the size every platform crops from.
 */
export const alt = `${business.name}, kitchenware and household essentials`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#1f6b52',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: 96, height: 96, borderRadius: 24, background: '#ffffff', color: '#1f6b52',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 60, fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>{business.tagline}</div>
        </div>

        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.1, marginTop: 40 }}>
          {business.name}
        </div>

        <div style={{ fontSize: 34, opacity: 0.9, marginTop: 24, maxWidth: 900 }}>
          Everything you need for your kitchen and home
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: 48, fontSize: 26, opacity: 0.85 }}>
          <div>Shop pickup</div><div>·</div><div>Local delivery</div><div>·</div><div>Order on WhatsApp</div>
        </div>
      </div>
    ),
    size,
  );
}
