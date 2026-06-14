# Firebase + Google Sign-In setup (click-by-click)

Everything here is on **free tiers**. Do it once.

## 1. Firebase project (Spark / free)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Enable services:
   - **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
   - **Firestore Database** → Create (production mode).
   - **Realtime Database** → Create.
   - **Storage** → Create.
   - **Cloud Messaging** is on by default.
3. **Project settings → General → Your apps → Web app (`</>`)**. Register one web app.
   Copy the config into `.env` — these are the `EXPO_PUBLIC_FIREBASE_*` values.
   > One web config works for Android **and** iOS because we use the Firebase **JS SDK**.

## 2. Deploy security rules
```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,database,storage
```
Rules live in [`firebase/`](../firebase). Re-deploy whenever you change them.

## 3. Google Sign-In — THREE OAuth client IDs
Created in **Google Cloud Console → APIs & Services → Credentials** (same project as Firebase).

| Client | Type | Key fields | Goes to env var |
|---|---|---|---|
| Web | Web application | Authorised redirect: `http://localhost:8081`, `https://auth.expo.io/@USER/duet` | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| iOS | iOS | Bundle ID `com.duet.app` (App Store ID / Team ID optional) | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Android | Android | Package `com.duet.app` + **SHA-1** | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |

- **Tip:** enabling Google in Firebase auto-creates a usable **Web client** — reuse it.
- **iOS reversed scheme:** `app.config.ts` derives `com.googleusercontent.apps.<id>`
  automatically from `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — no manual scheme entry.

### Android SHA-1 fingerprints
You need the SHA-1 of **every keystore you build with** (add one Android OAuth client each):

| Build path | Where the SHA-1 comes from |
|---|---|
| Local debug (`expo run:android`) | `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` |
| **EAS build** | `eas credentials` → Android → shows the fingerprint |
| Play Store | Play Console → Play App Signing |

> ⚠️ Forgetting the **EAS** SHA-1 is the #1 cause of `DEVELOPER_ERROR` (error 10) on installed Android builds.

## 4. Platform install cost reality (₹0 check)
- **Android:** install EAS/APK builds free, forever. ✅ truly ₹0.
- **iOS:** free Apple ID = sideload to your own device but the build **expires in 7 days**;
  non-expiring installs / TestFlight need the **Apple Developer Program ($99/yr)**.
  This is Apple's fee, unavoidable. Android-only stays strictly free.

## 5. AI proxy (free, no card) — optional but needed for AI features
Deploy the Cloudflare Worker and set `EXPO_PUBLIC_AI_PROXY_URL`. See [`functions/README.md`](../functions/README.md).

## env var checklist
```
EXPO_PUBLIC_FIREBASE_*              ← step 1 (web config)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID    ← step 3
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID    ← step 3 (also drives iOS URL scheme)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID← step 3
EXPO_PUBLIC_AI_PROXY_URL            ← step 5
```
