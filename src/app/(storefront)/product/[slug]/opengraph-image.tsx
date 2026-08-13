import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/queries/products';
import { business } from '@/lib/config';
import { effectivePriceCents, formatKsh, isOnSale } from '@/lib/money';

/**
 * The share preview for a single product — its name and current price.
 *
 * Drawn as a PNG rather than reusing the product photo, because the demo
 * catalogue images are SVG and social platforms ignore those. Once real
 * photographs are uploaded this could composite one in, but a clean typographic
 * card shares better than a small product shot on a phone anyway.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Product';

export default async function Image({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  const name = product?.name ?? business.name;
  const price = product ? formatKsh(effectivePriceCents(product)) : '';
  const wasPrice = product && isOnSale(product) ? formatKsh(product.priceCents) : null;
  const category = product?.categoryName ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '70px',
          background: '#fbf8f3', color: '#191713', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, background: '#ad4728', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>{business.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {category ? <div style={{ fontSize: 26, color: '#6b635a', marginBottom: 12 }}>{category}</div> : null}
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
          {price ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 28 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: '#ad4728' }}>{price}</div>
              {wasPrice ? (
                <div style={{ fontSize: 32, color: '#7c8a80', textDecoration: 'line-through' }}>{wasPrice}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 26, color: '#6b635a' }}>Shop pickup · Local delivery · Order on WhatsApp</div>
      </div>
    ),
    size,
  );
}
