# Per-Feature Cost Analysis (2 users · 1 relationship)

Legend: **✅ Sustainable free** · **⚠️ Free with redesign** · **❌ Needs paid (redesigned away)**

For each feature: *expected monthly cost*, *relevant free-tier limit*, *verdict*, and the *cheapest implementation* chosen.

---

### Auth (email/pw, Google, OTP, invite/linking) — ✅
- **Cost:** ₹0. Firebase Auth is unlimited-free for email/Google. **OTP/phone auth costs money on Firebase** (SMS billed).
- **Redesign:** Use **email OTP** (we send a 6-digit code via the free email path / a Cloudflare Worker + free email API like Resend's 3K/mo free tier) instead of SMS phone OTP. Invite/linking is just Firestore docs (a 6-char code) — free.
- **Verdict:** Sustainable. Avoid Firebase phone OTP (SMS = paid).

### F1 — Live Location Sharing — ✅ (with discipline)
- **Cost:** ₹0. Maps render via OS (react-native-maps → Apple/Google Maps SDK, **free, no API key billing** for display).
- **Limits:** RTDB write of a ~120-byte node. Even at 1 update / 30s while app is open ≈ 2,880 writes/day/user — trivial RTDB cost, **0 Firestore reads** (we use RTDB).
- **Redesign for battery + quota:** update only on *significant change* (distance filter ~50m) + when app foregrounded; throttle background to "significant-change" API. ETA via free OSRM/Valhalla demo server or simple haversine + avg speed (no paid Directions API). Distance = haversine, client-side, free.
- **Geofence / safe-arrival:** evaluate client-side when app open; for background, register OS geofences (free) and let a Cloudflare Worker send the FCM push.
- **Verdict:** Sustainable. **Continuous 1Hz background tracking is the only thing that would burn battery/quota → redesigned to significant-change.**

### F2 — Mood Sharing — ✅
- **Cost:** ₹0. Current mood in RTDB (1 write/change, instant). History = 1 Firestore write/change; ~10/day. Analytics computed client-side from history.
- **Verdict:** Sustainable trivially.

### F3 — Love Note Capsules — ✅
- **Cost:** ₹0. Firestore docs; media in Storage. "Encrypted until unlock": body stored encrypted, key withheld; unlock via Cloudflare **Cron Trigger** (free) that flips a flag + releases key. Rules also block early reads.
- **Limits:** <100 capsules/mo = nothing.
- **Verdict:** Sustainable. (Avoid Firebase scheduled functions → use free Cron Trigger.)

### F4 — Private Couple Social Feed — ✅
- **Cost:** ₹0. Posts/comments/reactions in Firestore, scoped to `coupleId`. Photos/videos in Storage, **compressed client-side** (expo-image-manipulator) to ~200KB.
- **Limits:** <100 media/mo, 5 GiB Storage. Fine.
- **Verdict:** Sustainable. Keep videos short (<30s) to protect Storage download quota.

### F5 — Instant Camera — ✅
- **Cost:** ₹0. expo-camera capture → compress → Storage → Firestore pointer + FCM push.
- **Expiring photos:** TTL field; client hides after expiry; a Cron Trigger deletes from Storage (free).
- **View receipts / reactions:** tiny Firestore writes.
- **Verdict:** Sustainable.

### F5b — Screenshot detection — ⚠️
- **Reality:** iOS only notifies *after* a screenshot (`UIApplicationUserDidTakeScreenshotNotification`); cannot block. Android can set `FLAG_SECURE` to block screenshots of secure screens (free) but detection of saved screenshots is unreliable.
- **Redesign:** Android → optional `FLAG_SECURE` on sensitive screens (free, blocks). iOS → detect-and-notify-partner only (free), and be honest in UI that it can't be prevented. **No paid SDK.**
- **Verdict:** Free best-effort; do not promise prevention.

### F6 — Daily BeReal for Couples — ✅
- **Cost:** ₹0. A free **Cron Trigger** fires once/day at a randomized time → sends FCM to both. 2-min timer client-side. Photos to Storage. Streak counter in Firestore (1 write/day).
- **Verdict:** Sustainable.

### F7 — Naughty Cards / Challenges — ✅
- **Cost:** ₹0. Content lives in Firestore (`gameContent`) **and** bundled as JSON in the app. App reads bundled JSON first (0 reads); syncs Firestore deck occasionally (a handful of reads/week). Favorites/daily = tiny writes.
- **Verdict:** Sustainable. Config-driven, no AI needed.

### F8 — Couple Wheel — ✅
- **Cost:** ₹0. Pure client animation (Reanimated). Reward history = small Firestore writes.
- **Verdict:** Sustainable.

### F9 — Fantasy Bucket List (Tinder-style match) — ✅
- **Cost:** ₹0. Each partner's entries in Firestore with `private` flag. Match logic: a Cloudflare Worker (or client w/ rules) reveals only when both flagged the same/similar item. Similarity via embeddings is optional; **default = exact tag match (free, no AI)**.
- **Verdict:** Sustainable. AI similarity optional and rate-limited.

### F10 — AI Relationship Mediator (flagship) — ✅
- **Cost:** ₹0 within free AI tiers. One mediation ≈ 1–2 AI calls. At <50 AI req/day you stay inside:
  - **Groq** free: very high RPM, fast (Llama 3.x) — primary.
  - **Gemini** free: 15 RPM / 1500 req/day (flash) — secondary.
  - **OpenRouter** free models (`:free` variants) — tertiary.
  - **DeepSeek** free credits — quaternary.
- **Redesign:** Results **cached in Firestore** so re-views cost 0. Router degrades to a structured template if all quotas hit.
- **Verdict:** Sustainable at your volume. Keys live only on the server proxy.

### F11 — Relationship Health Insights — ✅
- **Cost:** ₹0. Computed mostly **client-side** from existing data (mood freq, message cadence, taps). AI used only for the prose "suggestions" (optional, cached). No judgment score (by design).
- **Verdict:** Sustainable.

### F12 — AI Love Letter Generator — ✅
- **Cost:** ₹0. 1 AI call/letter, cached. Same router as F10. A few letters/week ≪ 50/day.
- **Verdict:** Sustainable.

### F13 — Personality Radar Chart — ✅
- **Cost:** ₹0. Victory Native / Skia, pure client render. Data in Firestore (1 doc).
- **Verdict:** Sustainable.

### F14 — Compatibility Dashboard — ✅
- **Cost:** ₹0. Quiz answers in Firestore; scoring is deterministic client logic. Optional AI summary (cached).
- **Verdict:** Sustainable.

### F15 — Love Language Detector — ✅
- **Cost:** ₹0. Rolling scores updated from in-app behavior; pure client math + 1 Firestore doc.
- **Verdict:** Sustainable.

### F16 — Relationship Timeline — ✅
- **Cost:** ₹0. Firestore events + Storage photos. <100 events ever.
- **Verdict:** Sustainable.

### F17 — Couple Games (This-or-That, Who-Knows-Me, Trivia, NHIE, Future Planning) — ✅
- **Cost:** ₹0. Question banks bundled + Firestore config. "Who Knows Me Better" / Trivia auto-generated from the couple's own stored data (client) or 1 cached AI call. Overlap % = client math.
- **Verdict:** Sustainable. Prefer bundled banks over AI to save quota.

### F18 — Ambient Audio Room (WebRTC) — ⚠️ (redesigned)
- **Reality:** WebRTC P2P is free for media, **but reliable connectivity needs a TURN relay**, and free TURN is scarce/unreliable; hosting TURN = paid bandwidth. Signaling can ride on RTDB (free).
- **Redesign (free):**
  1. **Signaling over RTDB** (free) — offer/answer/ICE candidates.
  2. **STUN-only** P2P (Google's free STUN). Works on most home/mobile NATs.
  3. **If P2P fails** (symmetric NAT): fall back to **Push-to-Talk voice notes** (record → Storage → FCM → autoplay). Feels "ambient" without a relay.
  4. "Always-on" mode kept short-session to protect battery; not a 24/7 stream.
- **Verdict:** ⚠️ Live duplex audio is the single hardest feature to keep free/reliable. Ship **push-to-talk voice notes first (✅ free, robust)**, offer experimental STUN-only live audio as opt-in. **No paid TURN.**

### F19 — Heartbeat Button — ✅
- **Cost:** ₹0. Tap → RTDB increment + FCM push. Daily/weekly/monthly counts = RTDB counters rolled up to 1 Firestore doc/day.
- **Verdict:** Sustainable. (Batch/debounce rapid taps to limit pushes.)

### F20 — Missing You Meter — ✅
- **Cost:** ₹0. Same mechanism as heartbeat; trends computed client-side.
- **Verdict:** Sustainable.

### F21 — Shared Dream Board (Pinterest-style) — ✅
- **Cost:** ₹0. Pins = Firestore docs + Storage images (compressed). Collections/reactions/notes = small writes.
- **Verdict:** Sustainable. External image "pinning" stores the URL only (0 storage) when possible.

---

## Summary

| Risk feature | Why | Free resolution |
|---|---|---|
| Phone OTP (SMS) | Firebase SMS is billed | **Email OTP** via free email API |
| Background location | battery + writes | **Significant-change** + OS geofences |
| Live audio room (F18) | TURN relay = paid | **STUN-only P2P + push-to-talk fallback** |
| Screenshot blocking (F5b) | iOS can't block | Android FLAG_SECURE; iOS detect+notify only |
| Cloud Functions / cron | not in Spark | **Cloudflare Workers + Cron Triggers (free)** |
| AI at scale | per-token billing | **Free models + router fallback + result cache** |

**Bottom line:** All 21 features are achievable at **₹0/month for 2 users**, with three features (location, audio, screenshots) intentionally redesigned to free equivalents, and all server/secret/cron work moved to **Cloudflare Workers** to avoid the Blaze requirement.
