# Planuf v47 - Messaging sync and button feedback

Live-data-safe front-end update.

## Messaging changes
- New chats are immediately written to Firestore `messageThreads`.
- New messages are immediately written to Firestore `messages`.
- Message read status is written back to Firestore with `readByUserIds` and `readAt`.
- A lightweight live unread listener watches Firestore for messages addressed to the signed-in app user.
- When a new incoming message arrives, the app shows a visible toast with an Open Messages button.

## Button feedback changes
- Buttons now show a slight pressed state on tap/click.
- Selected/active segmented buttons, tabs, chat rows, and yes/no-style selections now have a clearer selected colour.

## Data safety
- No Firebase Auth users are created, deleted, reset, or reseeded.
- No Firestore users/profiles are seeded, reset, overwritten, or recreated.
- This patch writes only message/messageThread/read-status updates when the user uses messaging.
