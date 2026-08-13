/**
 * Generates the placeholder product images used by the demo catalogue.
 *
 * These are plain SVG line drawings written at seed time. They exist so the
 * layout can be judged with something in every card, and they are deliberately
 * flat and obviously illustrative rather than photographic, so nobody mistakes
 * them for the real products. Replace them by uploading photos in
 * Admin > Products. No image is downloaded from the internet and no third
 * party's photograph is used.
 */

type Shape = 'bucket' | 'basin' | 'plate' | 'cup' | 'cutlery' | 'pot' | 'container' | 'broom' | 'brush' | 'box';

const ART: Record<Shape, string> = {
  bucket: `<path d="M150 150 L170 300 H330 L350 150 Z"/><ellipse cx="250" cy="150" rx="100" ry="22"/><path d="M160 150 Q250 60 340 150"/>`,
  basin: `<path d="M120 170 L160 290 H340 L380 170 Z"/><ellipse cx="250" cy="170" rx="130" ry="30"/>`,
  plate: `<circle cx="250" cy="215" r="115"/><circle cx="250" cy="215" r="80" opacity=".5"/><circle cx="250" cy="215" r="42" opacity=".3"/>`,
  cup: `<path d="M175 130 L195 300 H305 L325 130 Z"/><ellipse cx="250" cy="130" rx="75" ry="18"/><path d="M325 165 q55 10 45 55 q-8 42 -55 40"/>`,
  cutlery: `<path d="M175 110 v210"/><path d="M175 110 q-26 34 0 70 q26 -36 0 -70"/><path d="M250 110 v210"/><path d="M232 110 v52 M250 110 v52 M268 110 v52"/><path d="M232 162 q18 16 36 0"/><path d="M325 320 v-120 q0 -90 30 -90 v210"/>`,
  pot: `<rect x="150" y="160" width="200" height="140" rx="12"/><ellipse cx="250" cy="160" rx="100" ry="20"/><path d="M150 195 h-38 M350 195 h38"/><path d="M205 140 h90"/>`,
  container: `<rect x="160" y="150" width="180" height="160" rx="14"/><rect x="145" y="128" width="210" height="26" rx="10"/><path d="M195 190 v80 M250 190 v80 M305 190 v80" opacity=".35"/>`,
  broom: `<path d="M250 90 v130"/><path d="M185 220 h130 l24 100 H161 Z"/><path d="M200 250 v60 M230 250 v60 M262 250 v60 M292 250 v60" opacity=".45"/>`,
  brush: `<rect x="140" y="170" width="220" height="52" rx="26"/><path d="M165 222 v55 M195 222 v70 M225 222 v70 M255 222 v70 M285 222 v70 M315 222 v55"/>`,
  box: `<rect x="140" y="170" width="220" height="140" rx="10"/><rect x="128" y="140" width="244" height="36" rx="8"/><path d="M250 176 v134" opacity=".3"/>`,
};

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function placeholderSvg(shape: Shape, name: string, sku: string): string {
  const label = escapeXml(name.length > 34 ? `${name.slice(0, 33)}…` : name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500" role="img" aria-label="${escapeXml(name)} placeholder illustration">
  <rect width="500" height="500" fill="#f3ece2"/>
  <g fill="none" stroke="#ad4728" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".85">
    ${ART[shape]}
  </g>
  <text x="250" y="392" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="24" font-weight="600" fill="#191713">${label}</text>
  <text x="250" y="422" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" fill="#8a7f72">${escapeXml(sku)}</text>
  <text x="250" y="466" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13" letter-spacing="1.5" fill="#b5a897">PLACEHOLDER IMAGE</text>
</svg>`;
}

export type { Shape };
