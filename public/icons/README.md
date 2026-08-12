# App icons — PLACEHOLDERS

These are generated placeholder icons showing a white "D" on the brand green.
They are real, valid PNGs so the app is installable today, but they are not a logo.

## Replacing them

Export the real logo at these exact sizes and overwrite the files, keeping the names:

- `icon-192.png` — 192x192, the icon most Android launchers use
- `icon-512.png` — 512x512, used for splash screens and app listings
- `maskable-512.png` — 512x512, **keep the logo inside the middle 80%**; Android crops
  this one to a circle or squircle and anything near the edge will be cut off

No code change is needed — `src/app/manifest.ts` already points at these paths.
