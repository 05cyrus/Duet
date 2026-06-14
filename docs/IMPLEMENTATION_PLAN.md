# Feature-by-Feature Implementation Plan

Each feature is a vertical slice: `domain/ data/ application/ ui/`. The pattern is
already demonstrated end-to-end by **Mood (F2)**, **Heartbeat (F19)**, and
**Live Location (F1)** in `src/features/*`. Implement the rest by copying that shape.

> Status key: ✅ built in this scaffold · 🟡 hook/repo stubbed, UI to add · ⬜ planned

## Phase 0 — Foundation (DONE)
- ✅ Project config, theme, navigation, auth gate, couple linking
- ✅ Repository base + Firestore converters
- ✅ AIRouter abstraction + provider adapters + server proxy
- ✅ Security rules (Firestore / RTDB / Storage)

## Auth & Linking — ✅
- `authService` (email, Google, email-OTP scaffold), `coupleRepository` (invite/join txn).
- **Next:** wire `expo-auth-session` Google flow in a `useGoogleAuth` hook; finish email-OTP worker endpoints.

## F1 Live Location — ✅ slice
- `locationRepository` (RTDB), `useLiveLocation` (battery-aware watch + distance + ETA).
- **Next:** `LiveMap` screen with `react-native-maps` (two markers + polyline), geofence CRUD UI, register OS geofences, safe-arrival worker push.

## F2 Mood — ✅ slice
- `moodRepository` (RTDB current + Firestore history), `useMood`, `MoodPicker`, Home card.
- **Next:** mood history screen + simple analytics (counts/week from Firestore).

## F3 Love Capsules — ⬜
- `data`: capsule doc with `bodyCipher`, `unlockAt`. Encrypt body client-side (expo-crypto) with a key escrowed server-side; cron releases key + flips `unlocked`.
- `ui`: compose (text/image/voice), unlock-date picker, locked/unlocked list.

## F4 Private Feed — ⬜
- `postRepository` (subscribe to `couples/{id}/posts` desc). Media compressed client-side.
- `ui`: feed list, composer, reactions, comments sheet.

## F5 Instant Camera — 🟡
- `expo-camera` capture → compress → Storage → `snaps` doc + FCM. Expiry via TTL + cron cleanup. View receipts/reactions = field writes.

## F6 Daily BeReal — ⬜
- Cron worker picks a random daily time → FCM both. `bereal/{yyyy-mm-dd}` round + streak doc. 2-min client timer.

## F7 Challenge Cards — ⬜
- Bundled `assets/content/cards.json` + Firestore `gameContent/cards`. Shuffle, favorites, daily pick (seeded by date).

## F8 Couple Wheel — ⬜
- Reanimated rotation, weighted reward pick, `wheelSpins` history.

## F9 Fantasy Bucket List — ⬜
- `fantasies` with `tag`; reveal when both share a tag (worker or rules-guarded read). Tinder-style card UI.

## F10 AI Mediator (flagship) — 🟡
- `mediatorMessages` prompt ready. `MediationCase` collects both perspectives → `aiService.complete` (proxy) → parse JSON → cache `result`. Offline template fallback.

## F11 Health Insights — ⬜
- Client computes factor trends from mood/messages/taps; AI writes prose suggestions (cached). No score.

## F12 AI Love Letter — 🟡
- `loveLetterMessages` ready → `aiService` → store `letters`. Style picker UI.

## F13 Personality Radar — ⬜
- Victory Native `VictoryPolarAxis`/radar from `radars/{uid}`.

## F14 Compatibility — ⬜
- Quiz flow → deterministic scoring → optional cached AI summary.

## F15 Love Language — ⬜
- Rolling score updates from in-app behavior signals; 1 doc/user.

## F16 Timeline — ⬜
- `timeline` events ordered by date; photo attach; vertical timeline UI.

## F17 Couple Games — ⬜
- Question banks bundled; `GameSession` records answers; overlap % = client math. "Who knows me"/trivia generated from couple data (or 1 cached AI call).

## F18 Audio Room — ⬜ (redesigned free)
- Ship **push-to-talk voice notes** first (record → Storage → FCM → autoplay). Experimental STUN-only WebRTC with RTDB signaling as opt-in; **no paid TURN**.

## F19 Heartbeat — ✅ slice
- `tapRepository` (RTDB counters), `useTaps`, Home button. **Next:** weekly/monthly insights from daily rollups.

## F20 Missing-You — 🟡
- Reuses `useTaps('missingYou')`. **Next:** meter UI + trends + milestones.

## F21 Dream Board — ⬜
- `dreamPins` + `dreamCollections`; masonry grid; external-URL pins store URL only (0 storage).

## Cross-cutting next steps
1. **Notifications:** `src/core/notifications` — register FCM token on login, store in `users.pushTokens`, sends via `fcm-send` worker.
2. **Query↔listener bridge:** helper that pipes `onSnapshot` into `queryClient.setQueryData` so feed/timeline use React Query cache without polling.
3. **Media pipeline:** `expo-image-manipulator` compress-before-upload util in `src/core/utils/media.ts` (protects Storage quota).
4. **App Check:** enable to protect the AI proxy and Storage.
