# Planuf v57 repair build

Built from v49 stable messaging base.

- Restores stable Messages section instead of v50/v56 broken layouts.
- Adds mobile-only viewport max 430px.
- Adds image send button and back button assets.
- Keeps microphone to the left of send button.
- Adds fixed top header mobile behaviour and five-button nav fit.
- Adds safer generic back button on non-home/non-message pages.
- Adds visual dictate overlay only; browser speech recognition behaviour still depends on browser support.
- Keeps Firebase user/profile data live-data-safe: no seeding, resetting, overwriting, replacing, or recreating users/profiles.
