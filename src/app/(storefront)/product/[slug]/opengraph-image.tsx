import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/queries/products';
import { business } from '@/lib/config';
import { effectivePriceCents, formatKsh, isOnSale } from '@/lib/money';
import { potMarkLight } from '@/lib/brand-mark';

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
          background: '#f9f9f8', color: '#111110', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 18, background: '#111110',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={potMarkLight} alt="" width={44} height={44} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>{business.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {category ? <div style={{ fontSize: 26, color: '#6e6e6a', marginBottom: 12 }}>{category}</div> : null}
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
          {price ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 28 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: '#ad4728' }}>{price}</div>
              {wasPrice ? (
                <div style={{ fontSize: 32, color: '#9a9a95', textDecoration: 'line-through' }}>{wasPrice}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 26, color: '#6e6e6a' }}>Shop pickup · Local delivery · Order on WhatsApp</div>
      </div>
    ),
    size,
  );
}
