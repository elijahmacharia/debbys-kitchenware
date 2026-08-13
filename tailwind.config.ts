import type { Config } from 'tailwindcss';

/**
 * Colours live as CSS custom properties in src/app/globals.css. Tailwind only
 * gives them names, so the whole shop can be recoloured from one file.
 */
const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clay: {
          50: rgb('clay-50'), 100: rgb('clay-100'), 200: rgb('clay-200'),
          300: rgb('clay-300'), 400: rgb('clay-400'), 500: rgb('clay-500'),
          600: rgb('clay-600'), 700: rgb('clay-700'), 800: rgb('clay-800'), 900: rgb('clay-900'),
        },
        ink: rgb('ink'),
        muted: rgb('muted'),
        subtle: rgb('subtle'),
        surface: rgb('surface'),
        canvas: rgb('canvas'),
        raise: rgb('raise'),
        'raise-deep': rgb('raise-deep'),
        line: rgb('line'),
        'line-strong': rgb('line-strong'),
        success: rgb('success'),
        warning: rgb('warning'),
        danger: rgb('danger'),
        whatsapp: rgb('whatsapp'),
      },
      fontFamily: { sans: ['var(--font-sans)'], display: ['var(--font-sans)'] },
      maxWidth: { site: '82rem' },
      /*
       * The old class names are kept but given flatter values, so every
       * existing `rounded-card` becomes a 4px corner instead of 10px without
       * touching a hundred files. Softness comes from the palette now, not
       * from rounding everything.
       */
      borderRadius: { card: '1.5rem', control: '9999px' },
      boxShadow: {
        // Elevation is reserved for things that genuinely float above the
        // page: drawers, dropdowns, toasts. Never on static cards.
        card: 'none',
        soft: '0 2px 14px -6px rgb(17 17 16 / 0.10)',
        pop: '0 16px 40px -12px rgb(17 17 16 / 0.22)',
      },
      spacing: { '4.5': '1.125rem', '5.5': '1.375rem' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'slide-up': 'slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
