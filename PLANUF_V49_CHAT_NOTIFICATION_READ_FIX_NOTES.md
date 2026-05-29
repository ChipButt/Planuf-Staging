# Planuf v49 - Chat notification and read-behaviour fix

Live-data-safe update. This build changes messaging UI/behaviour only.

## Changed

- Replaces manual read workflow with automatic read behaviour.
- Hides the visible "Mark Read" button.
- Adds a top-of-screen slide-down message notification banner.
- Banner says a new message has arrived and can include sender/message preview.
- Banner slides in from the top, remains briefly, then slides back up after 3 seconds.
- Tapping the banner opens the relevant message thread.
- When the user is in a chat and reaches the latest messages at the bottom of the conversation, the thread is marked as read automatically after 2 seconds.
- New chat recipient checkboxes have been resized for mobile.
- New chat now starts with only the current user selected instead of everyone preselected.
- Fixed checkbox click handling so selecting one recipient should not select every recipient.

## Safety

This update does not seed, reset, overwrite, replace, or recreate Firebase Auth users or Firestore user/profile records.
