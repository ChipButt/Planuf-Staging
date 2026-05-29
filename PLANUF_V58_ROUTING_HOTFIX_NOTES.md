# Planuf v58 routing hotfix

Built from v57.

Fixes:
- Uses hash-based SPA routing so tab clicks do not push real GitHub Pages subpaths.
- Top nav buttons are forced tappable within the mobile-only layout.
- 404.html redirects route-style refreshes back to index.html#/route.
- No Firebase Auth users or Firestore user/profile records are seeded, reset, overwritten, replaced, or recreated.
