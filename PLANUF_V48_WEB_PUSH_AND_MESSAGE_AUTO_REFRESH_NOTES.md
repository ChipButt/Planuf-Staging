# Planuf v48 — Web push and message auto-refresh

This build keeps the live-data-safe rule: it does not seed, reset, overwrite, replace, or recreate Firebase Auth users or Firestore user/profile records.

## Added

- Foreground browser notifications for new messages when the app is open and notification permission is granted.
- A notification permission banner for users.
- A service worker file: `planuf-messaging-sw.js`.
- Message polling every 4 seconds as a fallback/mini-refresh so users do not have to manually refresh to discover new messages.
- A Firebase Function scaffold: `notifyOnMessageCreated`, which sends Firebase Cloud Messaging web push notifications when a message is created.
- Firestore rule access for `pushSubscriptions`.

## Important

True background web push, where the user gets a notification even when the app is closed, requires:

1. Firebase Web Push certificate / VAPID public key from Firebase Console.
2. Add that VAPID public key to the app as `window.PLANUF_FCM_VAPID_PUBLIC_KEY` or directly inside the v48 script.
3. Deploy Firebase Functions so `notifyOnMessageCreated` can send FCM notifications.
4. Deploy updated Firestore rules.

Without the VAPID key and deployed function, the app still gives foreground/local browser notifications while open and uses the 4-second mini-refresh/polling fallback.
