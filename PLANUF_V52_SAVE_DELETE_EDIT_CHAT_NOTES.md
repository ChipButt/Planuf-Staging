# Planuf v52 save toast, chat delete, edit/unsend patch

Live-data-safe UI/messaging patch. Does not seed, reset, overwrite, replace, or recreate Firebase Auth users or Firestore user/profile records.

Changes:
- Top slide-down “Progress saved” toast for idea/budget save/next actions.
- Swipe left on chat row reveals full-height red Delete Chat action.
- Delete Chat hides the thread for the current user locally and writes hiddenForUserIds to the Firestore messageThreads doc when possible.
- Press and hold own messages within 5 minutes to Edit Message or Unsend Message.
- Editing places the message text back into the composer, then Update Message writes back to the original message document.
- Unsend replaces message body with “This message was unsent” and marks status as unsent.
