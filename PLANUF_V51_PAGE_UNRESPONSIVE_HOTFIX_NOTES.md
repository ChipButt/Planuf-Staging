# Planuf v51 page-unresponsive hotfix

Built from v49 stable messaging base. v50 was treated as unsafe because it could lock the browser in a script loop.

Changes:
- Adds a safer Messenger-inspired messages layout.
- Uses a guarded/debounced script instead of a continuous DOM rewrite loop.
- Adds mobile chat list -> chat detail behaviour.
- Adds a back button with unread badge.
- Adds participant avatar/name header.
- Keeps the v49 slide-down top notification and auto-read behaviour.
- Keeps recipient checkbox size/selection fixes.

Live-data-safe: no Firebase Auth users or Firestore user/profile records are seeded, reset, overwritten, replaced, or recreated.
