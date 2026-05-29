# Planuf v60 refactor-only build

This build mechanically splits the large bundled `index.html` into separate CSS and JS files.

## Hard rules followed

- No Firebase Auth users are seeded, reset, overwritten, replaced, or recreated.
- No Firestore user/profile records are seeded, reset, overwritten, replaced, or recreated.
- Existing app logic was not intentionally redesigned in this pass.
- CSS and JS were extracted into separate files to make the app easier to inspect and patch.

## Files

- `index.html` now references `planuf-style-*.css` and `planuf-script-*.js/.mjs` files.
- `PLANUF_V60_REFACTOR_MANIFEST.json` maps extracted chunks back to their original inline style/script order.
- `404.html` is left as the lightweight GitHub Pages route redirect/fallback.

## Next step

Deploy this to staging first, test the staging URL on a phone, then fix messaging/mobile layout in smaller targeted files instead of injecting more code into one giant HTML file.
