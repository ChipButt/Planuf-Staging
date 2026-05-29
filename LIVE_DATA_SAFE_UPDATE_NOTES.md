# Live-data-safe update notes

This build is a production-safe code/UI update. It must not seed, reset, overwrite, replace, or recreate Firebase Auth users or Firestore user/profile records. Existing Firebase data remains the source of truth.

V37 hotfix: fixed the startup render crash caused when the local app state has no current user before Firebase has finished loading live users. The app now uses a non-admin temporary empty user object during startup instead of crashing. This does not create or write any user record.


## v39 mobile/startup patch
- UI-only mobile profile header and dictation icon positioning fixes.
- Adds a one-time post-login safety refresh only if the app lands on an empty users/profiles state after sign-in.
- Does not seed, reset, overwrite, replace, or recreate Firebase Auth users or Firestore user/profile records.
