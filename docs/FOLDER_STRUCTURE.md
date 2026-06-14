# Folder Structure

```
duet/
├── app/                          # expo-router routes (navigation = filesystem)
│   ├── _layout.tsx               # root providers + auth gate
│   ├── index.tsx                 # entry redirect
│   ├── (auth)/                   # sign-in, sign-up, otp, link-partner
│   └── (tabs)/                   # Home · Love · Camera · Games · Insights · Profile
│
├── src/
│   ├── core/                     # cross-cutting, feature-agnostic
│   │   ├── firebase/             # app init, auth, firestore, rtdb, storage, messaging
│   │   ├── data/                 # Repository base interface + converters + query-cache bridge
│   │   ├── ai/                   # AIRouter abstraction + provider adapters
│   │   ├── theme/                # tokens, light/dark palettes, ThemeProvider, useTheme
│   │   ├── ui/                   # reusable component library (Button, Card, Avatar, ...)
│   │   ├── state/                # shared zustand stores (session, theme)
│   │   ├── query/                # React Query client + helpers
│   │   ├── notifications/        # FCM + expo-notifications wiring
│   │   ├── config/               # env access via expo-constants
│   │   └── utils/                # date, geo (haversine/eta), crypto, format
│   │
│   ├── features/                 # one vertical slice per capability
│   │   ├── auth/                 # + couple linking/invite
│   │   ├── location/             # F1
│   │   ├── mood/                 # F2
│   │   ├── capsules/             # F3
│   │   ├── feed/                 # F4
│   │   ├── instant-camera/       # F5
│   │   ├── bereal/               # F6
│   │   ├── cards/                # F7
│   │   ├── wheel/                # F8
│   │   ├── fantasy/              # F9
│   │   ├── mediator/             # F10
│   │   ├── health/               # F11
│   │   ├── love-letter/          # F12
│   │   ├── radar/                # F13
│   │   ├── compatibility/        # F14
│   │   ├── love-language/        # F15
│   │   ├── timeline/             # F16
│   │   ├── games/                # F17
│   │   ├── audio-room/           # F18
│   │   ├── heartbeat/            # F19
│   │   ├── missing-you/          # F20
│   │   └── dream-board/          # F21
│   │       └── (each:) domain/ data/ application/ ui/ index.ts
│   │
│   └── types/                    # shared domain models (entities used across slices)
│
├── functions/                    # server-only jobs (Cloudflare Workers default)
│   ├── ai-proxy/                 # holds AI keys; runs AIRouter server-side
│   ├── fcm-send/                 # FCM HTTP v1 sender
│   ├── geofence/                 # safe-arrival + arrive/leave evaluation
│   └── cron/                     # capsule unlock · daily BeReal · expiring-photo cleanup
│
├── firebase/                     # security rules + indexes
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── database.rules.json
│   └── storage.rules
│
├── assets/                       # icons, splash, fonts, bundled game content JSON
├── docs/                         # ARCHITECTURE · COST_ANALYSIS · ROADMAP · this file
├── app.config.ts · tsconfig.json · babel.config.js · package.json · .env.example
```

## Conventions
- **Imports:** `@/` → `src/`, `@app/` → `app/` (see `tsconfig.json` paths + babel module-resolver).
- **A screen never imports `firebase` directly** — it goes screen → hook (`application/`) → repository (`data/`).
- **`domain/` is pure** — no React, no firebase, unit-testable.
- **Each feature exposes a single `index.ts`**; cross-feature use imports only from that surface.
