# The visual system

Everything is driven by CSS custom properties in `src/app/globals.css`. Change a
value there and the whole shop follows; Tailwind only gives the variables names.

## Direction

Near-white ground, near-black controls, soft grey surfaces, generous rounding.
Colour is left to the product photography, with one exception: **clay red
carries prices and sale badges**, so the number a shopper scans for is the only
coloured thing on the page.

## Palette

| Token | Use |
| --- | --- |
| `canvas` | Page background, a hair off white |
| `surface` | Cards, sheets, the header |
| `raise` / `raise-deep` | Image panels, quiet blocks, input fills |
| `ink` | Text **and** every primary button |
| `muted` / `subtle` | Secondary and tertiary text |
| `clay-600` | **Prices and sale badges only** |
| `whatsapp` | WhatsApp controls only |

Contrast: ink on canvas ~18:1, white on ink ~18:1, clay-600 on white ~5.3:1,
muted on canvas ~5.2:1. All above the WCAG AA threshold of 4.5:1.

## Shape language

| Element | Radius |
| --- | --- |
| Buttons, inputs, chips, steppers | Full pill |
| Cards, image panels, sheets | `rounded-3xl` (24px) |
| Badges | Full pill |

Borders are used sparingly. Separation comes from the tinted `raise` background
and from whitespace. Shadows appear only on things that genuinely float — the
tab bar's cart button, drawers, toasts, the wishlist heart.

## Patterns

- **Mobile tab bar** (`BottomNav`) — Home, Shop, raised Cart, Saved, Account.
  Hidden on large screens and inside checkout. `body` reserves height for it, so
  nothing hides underneath.
- **Filter chips** (`CategoryChips`) — a horizontally scrollable pill rail.
  Real links, so views are shareable and the back button works.
- **Product tile** — soft image panel, heart top-right, one circular add button
  straddling the bottom edge, name and price centred beneath. No border.
- **Cart line** — thumbnail left, name and SKU chip, line total right, then
  remove and quantity on their own row, matching the reference.
- **Order summary** — its own soft block, total in clay, full-width pill
  checkout.

## Rules the components follow

- **One action per product tile.** The image and name link through; enquiries
  use the floating WhatsApp button.
- **One badge maximum.** A discount outranks a New flag; nothing stacks.
- **Sections earn their place.** A homepage rail renders only if at least three
  products qualify (`MIN_RAIL`). A short honest page beats a padded one.
- **No product appears twice.** Each section excludes ids used above it, and the
  hero claims its product first.

## Typography

One geometric sans throughout; weight and size create hierarchy rather than a
second typeface. System faces, so nothing downloads and text paints on the first
frame.

**To use a licensed face**, add it in `src/app/layout.tsx`:

```ts
import { Manrope } from 'next/font/google';
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
// add sans.variable to the <html> className
```

Nothing else changes.

## Images

| Folder | Purpose |
| --- | --- |
| `public/categories/` | One landscape image per department |
| `public/demo-images/` | Generated product placeholders, committed so deployments have images |
| `public/icons/` | PWA icons |
| `src/app/icon.svg`, `apple-icon.png` | Favicon and Apple touch icon |
| `src/app/opengraph-image.tsx` | Share preview, rendered as PNG |

All illustrations are placeholders. Replace any file with a real photograph of
the same name; no code changes needed.
