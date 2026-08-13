# The visual system

Everything here is driven by CSS custom properties in `src/app/globals.css`.
Change a value there and the whole shop follows. Tailwind only gives the
variables names.

## Palette

| Token | Use |
| --- | --- |
| `canvas` `#fbf8f3` | Page background. Warm ivory, not white |
| `surface` `#ffffff` | Product frames, form panels |
| `raise` `#f6f1e9` | Tinted bands, image backgrounds |
| `ink` `#191713` | Text. Warm charcoal, not black |
| `muted` / `subtle` | Secondary and tertiary text |
| `clay-600` `#ad4728` | **The brand accent.** Prices, primary buttons, active nav |
| `olive-900` `#1b211a` | Dark bands, footer |
| `whatsapp` | WhatsApp controls only, so the colour always means one thing |

Clay was chosen because it belongs to earthenware and cookware. It reads as a
home-goods shop rather than software, and it is distinctive enough to recognise
on a carrier bag.

Contrast: ink on canvas ~15:1, white on clay-600 ~5.3:1, muted on canvas ~5.9:1.
All above the WCAG AA threshold of 4.5:1.

## Typography

A serif for headings, a sans for interface text. That pairing is the single
biggest reason the site no longer reads as a dashboard.

Both are system faces, so nothing downloads and text paints on the first frame.

**To use a real typeface**, add it in `src/app/layout.tsx`:

```ts
import { Fraunces } from 'next/font/google';
const display = Fraunces({ subsets: ['latin'], variable: '--font-display' });
// then add display.variable to the <html> className
```

Nothing else changes — every heading already reads `--font-display`.

## Principles the components follow

- **Not everything is a card.** Product listings use whitespace and a tinted
  image panel, no borders. `.card` is reserved for things that genuinely are
  panels: an order summary, a form, an admin table.
- **Elevation is for things that float.** Drawers, dropdowns and toasts get
  `shadow-pop`. Static content never gets a shadow.
- **Corners are 3–4px.** Heavy rounding everywhere is a generated-interface tell.
- **One action per product card.** Add to cart. The image and title link
  through; enquiries use the floating WhatsApp button.
- **One badge maximum** on a product. Sale beats New; nothing stacks.
- **Sections earn their place.** A homepage rail renders only if at least three
  products qualify (`MIN_RAIL` in the homepage). A short honest page beats a
  padded one.
- **No product appears twice.** Each homepage section excludes ids already used
  by the sections above it, and the hero claims its product first.

## Images

| Folder | Purpose |
| --- | --- |
| `public/categories/` | One landscape image per department |
| `public/demo-images/` | Generated product placeholders, committed so deployments have images |
| `public/icons/` | PWA icons |
| `src/app/icon.svg`, `apple-icon.png` | Favicon and Apple touch icon |
| `src/app/opengraph-image.tsx` | Share preview, rendered as PNG |

All the illustrations are placeholders. Replace any file with a real photograph
of the same name and no code changes are needed.
