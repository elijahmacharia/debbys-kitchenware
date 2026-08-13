# App icons

The mark is a lidded cooking pot on a near-black tile, with the shop name
underneath on the sizes large enough to read it. Generated, not photographed,
so it is crisp and tiny — the whole set is under 6 KB.

| File | Size | Shows | Used by |
| --- | --- | --- | --- |
| `icon-192.png` | 192x192 | pot + DEBBY'S | most Android launchers |
| `icon-512.png` | 512x512 | pot + DEBBY'S | splash screens, app listings |
| `maskable-512.png` | 512x512 | pot only | Android, cropped to a circle or squircle |

Two other files carry the same mark and live elsewhere:

- `src/app/icon.svg` — the browser tab favicon. Pot only. The name is left off
  deliberately: browsers render favicons at 16px, where any lettering becomes
  grey mush. The name appears in the tab title beside it instead.
- `src/app/apple-icon.png` — 180x180, the iPhone home screen icon.

## Why the maskable one is different

Android crops maskable icons and throws away everything outside the middle 80%.
The pot is scaled down to sit well inside that safe zone, and the name is
dropped because it would be sliced off. This is not an oversight.

## Replacing them with a real logo

Export at the exact sizes above and overwrite the files, keeping the names. No
code change is needed — `src/app/manifest.ts` already points at these paths.
Keep the maskable safe zone rule in mind.

The current files were drawn by a script rather than an image editor, because
the build environment has no image libraries and no fonts. That script is in
the project history if the shape ever needs regenerating; a designer replacing
these should just export from their own tool and ignore it.
