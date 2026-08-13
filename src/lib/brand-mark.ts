/**
 * The pot mark as a data URI, for the share images.
 *
 * The share images are rendered by Satori, which supports only a subset of
 * inline SVG. Handing it a finished image via `<img src={...} />` avoids the
 * question entirely and renders identically everywhere.
 *
 * Colours are baked in rather than read from CSS variables, because these PNGs
 * are generated on the server where no stylesheet exists. They mirror --ink,
 * --surface and --clay-600 in globals.css. If the mark changes, update
 * src/components/brand/PotMark.tsx and src/app/icon.svg to match.
 */
function markSvg({ pot, knob }: { pot: string; knob: string }): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">',
    `<circle cx="32" cy="16.47" r="3.16" fill="${knob}"/>`,
    `<path d="M21.33 22.72A10.67 4.83 0 0 1 42.67 22.72Z" fill="${pot}"/>`,
    `<rect x="13.63" y="22.72" width="36.75" height="4.64" rx="2.09" fill="${pot}"/>`,
    `<rect x="10.66" y="32.46" width="6.31" height="5.1" rx="2.3" fill="${pot}"/>`,
    `<rect x="47.03" y="32.46" width="6.31" height="5.1" rx="2.3" fill="${pot}"/>`,
    `<path d="M14.37 27.36H49.63L46.85 46.38Q46.11 51.49 41 51.49H23Q17.89 51.49 17.15 46.38Z" fill="${pot}"/>`,
    '</svg>',
  ].join('');
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** White pot, clay knob — for placing on the near-black tile. */
export const potMarkLight = toDataUri(markSvg({ pot: '#ffffff', knob: '#ad4728' }));

/** Near-black pot, clay knob — for placing directly on a pale background. */
export const potMarkDark = toDataUri(markSvg({ pot: '#111110', knob: '#ad4728' }));
