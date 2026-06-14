# Duet 💞

A private, feature-rich couples app for **two people**, engineered to run at **₹0 / $0 per month** on free tiers (Firebase Spark + Cloudflare Workers + free AI models).

> Expo (React Native) · TypeScript · Expo Router · React Query · Zustand · Reanimated · Firebase · provider-agnostic AI (Gemini / Groq / OpenRouter / DeepSeek)

## What's in this scaffold

| Area | Status |
|---|---|
| Architecture, schemas, security rules, cost analysis | ✅ complete (`docs/`, `firebase/`) |
| Theme system (dark/light) + reusable UI kit | ✅ |
| Auth + couple linking (email, Google, email-OTP scaffold) | ✅ |
| AI abstraction layer + server proxy | ✅ |
| F1 Location · F2 Mood · F19 Heartbeat | ✅ working vertical slices |
| F3–F21 | 🟡/⬜ planned — see `docs/IMPLEMENTATION_PLAN.md` |

## Docs (read in this order)
1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, layering, the ₹0 strategy
2. [`docs/COST_ANALYSIS.md`](docs/COST_ANALYSIS.md) — per-feature monthly cost & free-tier viability (all 21)
3. [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md)
4. [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Firestore + RTDB schema
5. [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — feature-by-feature build guide
6. [`docs/ROADMAP.md`](docs/ROADMAP.md) — MVP + premium roadmaps
7. [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) — click-by-click Firebase + Google Sign-In setup

## Getting started
```bash
cd duet
cp .env.example .env          # fill in Firebase + Google OAuth client config
npm install
npx expo start
```

### Firebase setup (Spark / free)
1. Create a Firebase project. Enable **Auth** (Email/Password + Google), **Firestore**, **Realtime Database**, **Storage**, **Cloud Messaging**.
2. Paste the web config into `.env` (`EXPO_PUBLIC_FIREBASE_*`).
3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,database,storage
   ```
4. Enable **App Check** (free) to protect Storage + the AI proxy.

### Server jobs (free, no Blaze) — see [`functions/README.md`](functions/README.md)
Deploy the Cloudflare Worker for the AI proxy, FCM sender, geofence eval, and cron:
```bash
cd functions && wrangler deploy
# set AI keys as worker secrets, then put the URL in .env:
# EXPO_PUBLIC_AI_PROXY_URL=https://<worker>.workers.dev
```

## The ₹0 guarantee
Every one of the 21 features is designed to fit free tiers for 2 users. Three features are
intentionally **redesigned** to stay free (location → significant-change, audio → STUN+push-to-talk,
OTP → email not SMS), and all secret/cron/server logic runs on Cloudflare Workers to avoid
Firebase's paid Blaze requirement. Full numbers in [`docs/COST_ANALYSIS.md`](docs/COST_ANALYSIS.md).

## Cost-safety checklist
- Use **listeners, never polling** (already enforced via React Query defaults + repos).
- Keep high-frequency data (location, mood, taps) in **RTDB**, overwrite-in-place.
- **Compress media** before upload; cap video length.
- **Cache AI results** in Firestore so a re-view never re-bills a call.
- AI **degrades gracefully** to a template when all free quotas are hit.
