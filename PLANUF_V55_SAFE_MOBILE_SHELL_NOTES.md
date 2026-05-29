# Planuf v55 safe mobile shell notes

Built from v53, not v54.

Changes:
- Locks the visible app to a mobile portrait width, max 430px.
- On desktop, the app is centred in a phone-width column.
- Keeps the top app banner/header fixed at the top of the viewport.
- Main content scrolls underneath the fixed header.
- Section tabs use a horizontal mobile scroll row so the buttons remain tappable/readable.
- Fixed a v53 observer setting that could react to its own class changes.

Live-data-safe: no Firebase Auth users or Firestore user/profile records are seeded, reset, overwritten, replaced, or recreated.
