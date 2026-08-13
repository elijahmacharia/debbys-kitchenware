/**
 * The brand mark: a lidded cooking pot.
 *
 * Kept as one component so the header and everything else that shows the mark
 * can never drift apart. The same geometry is repeated in three other places
 * for technical reasons that cannot be designed away:
 *   - src/app/icon.svg     — a static file, because browsers request the favicon directly
 *   - public/icons/*.png   — raster, because Android and iOS will not accept SVG
 *   - src/lib/brand-mark.ts — for the share images, which are flattened to PNG
 * Change the shape here and change it there too. The PNGs are regenerated with
 * `python3 scripts/generate-icons.py`.
 *
 * Colours are inherited: `currentColor` fills the pot, so the mark works on a
 * light or a dark background without a second copy.
 */
export function PotMark({ className, accent = true }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true" focusable="false">
      <circle cx="32" cy="16.47" r="3.16" fill={accent ? 'rgb(var(--clay-600))' : 'currentColor'} />
      <path d="M21.33 22.72A10.67 4.83 0 0 1 42.67 22.72Z" fill="currentColor" />
      <rect x="13.63" y="22.72" width="36.75" height="4.64" rx="2.09" fill="currentColor" />
      <rect x="10.66" y="32.46" width="6.31" height="5.1" rx="2.3" fill="currentColor" />
      <rect x="47.03" y="32.46" width="6.31" height="5.1" rx="2.3" fill="currentColor" />
      <path d="M14.37 27.36H49.63L46.85 46.38Q46.11 51.49 41 51.49H23Q17.89 51.49 17.15 46.38Z" fill="currentColor" />
    </svg>
  );
}
