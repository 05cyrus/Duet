# Push Notifications setup (free, via Expo push)

Duet uses **Expo's push service** — free, no Cloud Functions. The app stores each
device's Expo push token on the user doc and sends pings directly to the
partner's token. This powers Heartbeat (F19), Missing You (F20), BeReal (F6),
safe-arrival (F1), and instant camera (F5).

## ⚠️ Delivery requires a development build
Remote push does **not** work in Expo Go (Android dropped it; iOS is limited).
The token registration + send code is already wired — it just no-ops in Expo Go.
To actually receive pushes, install a dev build:

```bash
eas build --profile development --platform android
```

### Android (free)
Expo push for Android rides on **FCM**, which needs a credential on your Expo project:
```bash
eas credentials        # Android → Push Notifications (FCM) → set up
```
EAS can configure an **FCM V1 service account** for you (free). Once set, the
Expo push token delivers to Android. No code changes.

### iOS (needs Apple Developer account)
APNs requires the **Apple Developer Program ($99/yr)**. With it:
```bash
eas credentials        # iOS → Push Notifications → let EAS create the APNs key
```
Without a paid Apple account, iOS push won't deliver (Apple limitation, not Duet's).
Android-only stays strictly ₹0.

## How to test
1. Install dev builds on both phones (or at least the receiver).
2. Open the app on both → grant the notification permission prompt → each device
   saves its Expo token to its user doc (`users/{uid}.pushTokens`).
3. From phone A tap the ❤️ Heartbeat → phone B gets **"💓 ... is thinking about you"**.

## Verifying tokens were saved
In Firestore, open `users/{uid}` — you should see a `pushTokens` array with a
value starting `ExponentPushToken[...]`. If it's empty:
- you're in Expo Go (use a dev build), or
- on a simulator (use a physical device), or
- permission was denied (re-enable in OS settings).

## Cost
Expo's push service is **free and unlimited** for this volume. Android FCM is
free. The only possible cost is the Apple Developer account for iOS delivery.

## Notes / future hardening
- Sends are **client-side** for now (2 users). Tokens are private (Firestore
  rules gate the user docs). If ever public, move sending to the Cloudflare
  worker (`functions/fcm-send`) and verify with App Check.
- Heartbeat taps aren't debounced yet — rapid taps send rapid pushes. Add a
  throttle if it gets spammy.
