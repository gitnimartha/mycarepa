# Recent Changes (May 13–14, 2026)

This README has been pared down to track only the last two days of work on this repo. See `git log` for full history.

## Server

Backend is deployed on **Railway** and reachable at:

```
https://api.mycarepersonalassistant.com
```

(The underlying Railway URL is `https://mycarepa-production.up.railway.app`.) The frontend is hosted separately on Readdy and calls this API directly.

## Currently available endpoints

All paths below are relative to `https://api.mycarepersonalassistant.com`.

### Trial flow (bridge Stripe account)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/send-trial-verification-code` | POST | Generates a 6-digit code, stores it in bridge customer metadata, emails via Resend. Expiry in ms. No active-subscription check. |
| `/api/verify-trial-customer` | POST | Validates code against bridge customer metadata. Reads expiry in ms. |

Requires env var `BRIDGE_STRIPE_SECRET_KEY`. Without it both endpoints return HTTP 500.

### Video progress (Legal Masterclass)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/video-progress` | POST | Persists `{ videoId, currentTime, duration, completed }` to bridge customer metadata. |
| `/api/video-progress` | GET | Returns progress plus a precomputed `buttonText` (Start/Continue Learning, Watch Again). Optional `?videoId=` scopes the response. |

Progress lives on the bridge account only. Full API contract: `docs/VIDEO_PROGRESS_API.md`.

### Other endpoints (unchanged in this window, listed for reference)

| Endpoint | Method |
|----------|--------|
| `/api/create-checkout-session` | POST |
| `/api/send-verification-code` | POST |
| `/api/verify-customer` | POST |
| `/api/check-subscription` | POST |
| `/api/upgrade-subscription` | POST |
| `/api/report-usage` | POST |
| `/api/usage/:customerId` | GET |
| `/api/prices` | GET |
| `/api/session/:sessionId` | GET |
| `/api/webhook` | POST |
| `/api/assistant/login` | POST |
| `/api/assistant/search` | POST |
| `/api/assistant/lookup` | POST |
| `/api/assistant/report-usage` | POST |
| `/api/admin/create-trial-user` | POST |
| `/api/admin/check-customer` | GET |
| `/api/health` | GET |

## Trial user batch import

`scripts/add-trial-users.cjs` bulk-creates trial subscriptions from a CSV.

```bash
node scripts/add-trial-users.cjs "path/to/file.csv"
```

- Auto-detects `email` / `first` / `last` columns from headers
- 20 concurrent requests, normalizes emails to lowercase, skips existing subscribers
- Writes `trial-users-success-*.csv` and `trial-users-errors-*.csv` next to the input

Result CSVs contain customer PII and are gitignored.

## Infrastructure / gitignore

- `.railwayignore` — keeps non-runtime files out of the Railway build context.
- `.gitignore` now excludes:
  - `scripts/trial-users-*.csv` (PII)
  - `scripts/setup-railway-env.bat`, `scripts/toggle-stripe.bat` (contain Stripe secret keys — keep local copies, do not commit)

## Railway CLI setup

```bash
npm install -g @railway/cli   # one-time install
railway login                 # opens browser, authenticates this machine
railway link                  # link this folder to the mycarepa project (pick from list)
railway status                # confirm the link
```

Common commands once linked:

```bash
railway up                    # build + deploy current directory
railway logs                  # stream production logs
railway variables             # list env vars set on the service
railway variables set KEY=value
railway open                  # open the service dashboard in a browser
```

To point at a different Railway account, run `railway logout` then `railway login` again.

## Development

```bash
npm install
npm run dev:all   # frontend + backend together
```

## Deploy

```bash
railway up
```
