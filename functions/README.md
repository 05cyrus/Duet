# Server jobs (free, no Firebase Blaze required)

These run on **Cloudflare Workers** (free: 100k req/day + free Cron Triggers, no card).
The code is provider-neutral so it can also deploy to Vercel/Netlify or Firebase Functions.

| Job | Path | Trigger | Why server-side |
|---|---|---|---|
| AI proxy | `ai-proxy/worker.ts` | HTTPS POST `/complete` | holds AI keys; runs `AIRouter` fallback |
| FCM sender | `fcm-send/` | HTTPS (called by jobs) | needs FCM service-account credential |
| Geofence eval | `geofence/` | HTTPS on location change | safe-arrival / arrive-leave → push |
| Cron | `cron/` | Cloudflare Cron Triggers | capsule unlock · daily BeReal · expiring-snap cleanup |

## Deploy (Cloudflare)
```bash
npm i -g wrangler
wrangler login
wrangler secret put GROQ_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put DEEPSEEK_API_KEY
wrangler deploy
```
Then set `EXPO_PUBLIC_AI_PROXY_URL=https://<your-worker>.workers.dev` in the app `.env`.

## Cron schedule (wrangler.toml)
```toml
[triggers]
crons = [
  "*/5 * * * *",   # capsule unlock + expiring-snap cleanup (every 5 min)
  "0 13 * * *"     # daily BeReal prompt window (randomized inside handler)
]
```

> **Why not Firebase Cloud Functions?** They require the Blaze plan (card on file).
> For 2 users the Blaze free allowance would never bill, but Cloudflare keeps the
> guarantee of ₹0 with zero billing risk. See `docs/COST_ANALYSIS.md` §8.
