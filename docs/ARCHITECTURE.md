# Duet — Architecture

> A private couples app for **two users, one relationship**, engineered to run at **₹0 / $0 per month** on free tiers.

## 1. Guiding principles

1. **Two-user scale is a superpower.** Every "this needs paid infra at scale" feature is fine here because there is exactly one relationship. We design for `N=2`, not `N=millions`.
2. **Reads/writes are the scarce resource**, not storage or compute. Firestore Spark gives 50K reads / 20K writes / 20K deletes **per day**. With 2 users that is effectively unlimited *if we avoid polling*. So: **listeners + cache, never poll**.
3. **Realtime Database (RTDB) for ephemeral high-frequency data** (location, presence, typing, heartbeat). RTDB Spark = 1 GB stored + 10 GB/month download. Location pings are tiny (~120 bytes) and we overwrite the same node, so stored size stays ~constant.
4. **Cloud Functions are the only place secrets live.** AI keys, FCM sends, geofence/safe-arrival logic run server-side. Spark plan does **not** include Functions deploy — see §8 for the free workaround.
5. **AI is provider-agnostic and degrades gracefully.** A router tries the cheapest free model first, falls back across providers, and finally to a templated offline response.

## 2. High-level system diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Expo / React Native App                   │
│                                                               │
│  app/            expo-router screens (file-based routes)      │
│  src/features/*  feature modules (ui · hooks · repo · store)  │
│  src/core/*      firebase · ai · theme · ui-kit · utils       │
│                                                               │
│   Zustand (client/ephemeral state)                            │
│   React Query (server cache, subscriptions bridged in)        │
└───────────┬───────────────────────────┬──────────────────────┘
            │                           │
   listeners│ (no polling)              │ callable / HTTPS
            ▼                           ▼
┌────────────────────────┐   ┌──────────────────────────────────┐
│  Firebase (Spark)       │   │  Server logic (free options)      │
│                         │   │                                    │
│  Auth                   │   │  A) Cloudflare Workers (free)      │
│  Firestore (durable)    │   │  B) Vercel/Netlify functions (free)│
│  Realtime DB (ephemeral)│   │  C) Cloud Functions (needs Blaze;  │
│  Storage (media)        │   │     guarded w/ budget alert = ₹0)  │
│  Cloud Messaging (FCM)  │   │                                    │
└────────────────────────┘   │  Holds: AI keys, FCM server send,  │
                             │  geofence eval, capsule unlock cron │
                             └──────────────────────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────┐
                        │  AI providers (free tiers)     │
                        │  Gemini · Groq · OpenRouter ·  │
                        │  DeepSeek  → AIRouter abstraction│
                        └──────────────────────────────┘
```

## 3. Layered / clean architecture

Each feature is a vertical slice; layers within a slice:

```
features/<feature>/
  domain/        # entities, value objects, pure logic (no RN, no firebase)
  data/          # repositories — the ONLY place that touches firebase
  application/   # hooks (React Query + Zustand), use-cases
  ui/            # screens + components (presentational, dumb where possible)
  index.ts       # public surface of the slice
```

**Dependency rule:** `ui → application → data → domain`. Domain depends on nothing. UI never imports firebase directly; it goes through hooks → repositories. This keeps features testable and lets us swap Firebase later without touching screens.

### Repository pattern

Every collection has a repository implementing a typed interface (see `src/core/data/Repository.ts`). Repos return domain entities, hide Firestore/RTDB details, and centralize read-cost discipline (e.g. "subscribe once, cache, share").

## 4. State management split

| Concern | Tool | Why |
|---|---|---|
| Server data (profiles, posts, moods, capsules) | **React Query** | dedupe, cache, retries; we bridge Firestore `onSnapshot` into the query cache so live data flows without polling |
| Ephemeral/local UI (theme, camera mode, wheel state, draft forms) | **Zustand** | tiny, no boilerplate |
| Forms | **React Hook Form + zod** | type-safe validation |
| High-frequency realtime (location, presence, heartbeat) | **RTDB listeners → Zustand** | bypass React Query; raw subscription is cheapest |

## 5. Navigation (expo-router)

```
app/
  _layout.tsx                 # providers: Query, Theme, Auth gate
  index.tsx                   # redirect → onboarding | (tabs)
  (auth)/                     # unauthenticated stack
    sign-in.tsx
    sign-up.tsx
    otp.tsx
    link-partner.tsx          # invite code / relationship linking
  (tabs)/                     # main app — 6 tabs
    _layout.tsx
    index.tsx                 # 1. Home  (dashboard: mood, location, heartbeat)
    love.tsx                  # 2. Love  (notes, capsules, dream board, missing-you)
    camera.tsx                # 3. Camera (instant cam / BeReal)
    games.tsx                 # 4. Games (cards, wheel, quizzes, this-or-that)
    insights.tsx              # 5. Insights (radar, health, compatibility, AI)
    profile.tsx               # 6. Profile (settings, relationship, geofences)
  feed/[postId].tsx           # detail routes pushed over tabs
  capsule/[id].tsx
  mediator/index.tsx
  ...
```

Auth gating happens in `app/_layout.tsx`: an `<AuthGate>` reads auth state and `partnerId`; routes users to `(auth)` → link-partner → `(tabs)`.

## 6. Data store strategy — which store for which feature

| Data | Store | Rationale (cost) |
|---|---|---|
| Live location, speed, battery | **RTDB** | overwrite one node/user; tiny payload; no read-quota burn |
| Presence / online | **RTDB** `.info/connected` + onDisconnect | free, built-in |
| Mood (current) | **RTDB** (current) + **Firestore** (history) | instant sync via RTDB; durable analytics in Firestore written once/change |
| Heartbeat / missing-you taps | **RTDB** counter + daily Firestore rollup | thousands of taps = thousands of cheap RTDB writes, summarized to 1 Firestore doc/day |
| Profiles, relationship | **Firestore** | durable, structured, rules-friendly |
| Posts, comments, reactions | **Firestore** | durable; listeners scoped to the couple |
| Love capsules | **Firestore** (locked, server-gated unlock) | durable + scheduled unlock |
| Photos / videos / voice | **Storage** | media; keep <100/mo, compress client-side |
| Games content (cards, questions) | **Firestore** (config-driven) + bundled JSON fallback | editable without app update; bundled copy = 0 reads |
| AI outputs (mediator, letters) | **Firestore** | cache results so we never re-bill an AI call |

## 7. Cost model — the numbers

**Firebase Spark (free) hard limits & our usage @ 2 users:**

| Resource | Free limit | Our projected use | Headroom |
|---|---|---|---|
| Firestore reads | 50,000 / day | ~1,500 / day (listeners, cached) | 33× |
| Firestore writes | 20,000 / day | ~800 / day | 25× |
| Firestore storage | 1 GiB | <50 MB | huge |
| RTDB stored | 1 GiB | <5 MB (overwrite nodes) | huge |
| RTDB download | 10 GiB / mo | <1 GiB | 10× |
| Storage | 5 GiB | <2 GiB (100 photos/mo compressed) | ok |
| Storage download | 1 GiB / day | <100 MB / day | huge |
| Auth | unlimited free | trivial | — |
| FCM | unlimited free | trivial | — |
| **Cloud Functions** | **NOT in Spark** | see §8 | — |

**Conclusion:** Every feature except those needing server-side secrets/cron fits comfortably in Spark. The only architectural risk is Cloud Functions, handled next.

## 8. The Cloud Functions problem (and the ₹0 fix)

Firebase **Cloud Functions require the Blaze (pay-as-you-go) plan**. Blaze has a *free monthly allowance* (2M invocations, 400K GB-sec) which 2 users will never exceed — but it requires a card and *can* bill if abused. Three ways to stay at ₹0:

- **Option A (recommended): Cloudflare Workers.** 100,000 requests/day free, no card. We host the 4 server-only jobs here:
  1. **AI proxy** — holds AI keys, runs the `AIRouter`, returns completions. (Keys never touch the device.)
  2. **FCM sender** — sends pushes via FCM HTTP v1 using a service account.
  3. **Geofence / safe-arrival evaluator** — called by the client on location change, or via Cron Triggers.
  4. **Capsule unlock + daily BeReal trigger** — Cloudflare **Cron Triggers** (free) replace Firebase scheduled functions.
- **Option B:** Vercel/Netlify serverless functions (free tier) — same role, also no card for hobby use.
- **Option C:** Enable Blaze but set a **₹0 budget alert + low quota caps**; for 2 users you stay inside the free allowance. Simplest if you accept putting a card on file.

> This repo's `functions/` folder is written **provider-neutral** (plain handlers) so the same code deploys to Cloudflare Workers, Vercel, or Firebase Functions with a thin adapter. Default target: **Cloudflare Workers**.

## 9. Security model

- **Auth required** for everything. No anonymous reads.
- **Couple isolation:** every durable doc carries a `coupleId`; rules allow read/write only if `request.auth.uid` is a member of that couple. A user can belong to exactly one active couple.
- **Capsules:** locked field is server-set; clients cannot read capsule body before `unlockAt`. Enforced in rules (`unlockAt <= request.time`) and decryption key released by the server job at unlock.
- **AI keys** never in client. App Check (free) attests requests to the AI proxy to stop key abuse.
- **Storage:** media paths namespaced by `coupleId`; rules restrict to members; signed-ish access via rules.
- See `firebase/firestore.rules`, `firebase/database.rules.json`, `firebase/storage.rules`.

## 10. Graceful degradation matrix

| Subsystem | Free-tier failure | Fallback |
|---|---|---|
| AI provider quota hit | 429 from Gemini/Groq/etc | router tries next provider → templated offline output |
| Maps API | n/a (react-native-maps uses OS maps, free) | — |
| Audio room (WebRTC) | TURN relay would cost | P2P STUN-only (free); if NAT blocks, fall back to push-to-talk **voice notes** (Storage) |
| Screenshot detection | unreliable/unfree on iOS | best-effort Android `FLAG_SECURE` + "screenshots aren't blocked" honesty in UI |
| Background location | battery + quota | foreground + significant-change only; coarse interval |

See `docs/COST_ANALYSIS.md` for the per-feature breakdown of every one of the 21 features.
