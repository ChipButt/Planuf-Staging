# Alex login/profile fix

This version removes the old seeded Alex admin/profile from the default app data. If Alex already exists in your Firebase Firestore from earlier testing, delete/archive him from People and Logins or remove these Firestore documents manually:

- `profiles/profile-alex`
- `users/user-alex`

If you created a real Firebase Auth account for Alex, manage that in Firebase Console > Authentication > Users. The app cannot directly change another person’s Firebase Auth password from the public client app.

Admins can now archive or delete profiles from People and Logins. Delete removes the app profile and linked app login record. It does not delete the Firebase Auth account.
