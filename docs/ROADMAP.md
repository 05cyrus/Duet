# Roadmap

## MVP (ship to just the two of you) — all ₹0
Goal: a delightful daily-use app with the cheapest, highest-value features first.

**Milestone 1 — Connect (week 1)**
- Auth (email + Google), couple linking via invite code ✅
- Theme, navigation, 6 tabs ✅
- Mood sharing (F2) ✅ · Heartbeat (F19) ✅ · Missing-You (F20)

**Milestone 2 — Presence (week 2)**
- Live location + distance + ETA (F1) ✅ slice → add map UI
- Geofences + safe-arrival pushes (F1)
- Notifications plumbing (FCM token + worker sender)

**Milestone 3 — Memories (week 3)**
- Private feed (F4) · Instant camera (F5) · Daily BeReal (F6)
- Timeline (F16) · Dream board (F21)

**Milestone 4 — Play (week 4)**
- Challenge cards (F7) · Couple wheel (F8) · Couple games (F17)
- Love capsules (F3) · Fantasy list (F9)

## Premium / flagship (still ₹0 via free AI tiers)
- AI Relationship Mediator (F10) — the headline feature
- AI Love Letter (F12)
- Relationship Health insights (F11)
- Personality Radar (F13) · Compatibility (F14) · Love Language (F15)
- Ambient audio: push-to-talk voice notes → experimental live audio (F18)

## "Premium" gating model
Since this is for two people, "premium" is about **build order and polish**, not paywalls.
If you ever publish it, the natural paid tier = AI features (mediator/letters/insights)
because those are the only ones with a marginal cost — and even those are free at this volume.

## Explicitly deferred / redesigned (see COST_ANALYSIS.md)
- ❌ Firebase phone/SMS OTP → ✅ email OTP
- ❌ 24/7 background GPS → ✅ significant-change updates
- ❌ Paid TURN audio relay → ✅ STUN-only + push-to-talk voice notes
- ❌ iOS screenshot *blocking* → ✅ detect-and-notify (Android FLAG_SECURE where possible)
- ❌ Firebase Cloud Functions (Blaze) → ✅ Cloudflare Workers + Cron Triggers
