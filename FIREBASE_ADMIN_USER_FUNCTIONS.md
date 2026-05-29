# Firebase admin user actions

This build includes browser-side People and Logins changes plus a `functions/` folder for the secure Firebase Authentication actions.

The static app can hide, archive, restore and remove Firestore records, but it cannot safely delete or disable another person's Firebase Authentication account from the browser. For linked Firebase Auth users, the app now calls these HTTPS Cloud Functions:

- `archiveStaffUser` — disables the Firebase Auth account and marks the profile/user as archived.
- `restoreStaffUser` — re-enables the Firebase Auth account and restores the profile/user.
- `deleteStaffUser` — deletes the Firebase Auth account and removes profile/user records.

Deploy the functions from the `functions/` folder before relying on live Auth deletion/disabling:

```bash
cd functions
npm install
firebase deploy --only functions
```

The functions verify the caller's Firebase ID token and check the caller is an active Admin in Firestore before making Auth changes.
