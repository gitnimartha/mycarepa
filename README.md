# Recent Changes (May 13–14, 2026)

This README has been pared down to track only the last two days of work on this repo. See `git log` for full history.

## Trial verification flow (bridge Stripe account)

A secondary ("bridge") Stripe account holds trial customers created by the checkout-bridge service. The two trial endpoints route exclusively to that account; they never fall back to the primary account.

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/send-trial-verification-code` | POST | Generates a 6-digit code, stores it in bridge customer metadata, emails via Resend. Expiry written in ms. No active-subscription check. |
| `/api/verify-trial-customer` | POST | Validates code against bridge customer metadata. Reads expiry in ms. |

Required env var: `BRIDGE_STRIPE_SECRET_KEY`. Without it both endpoints return HTTP 500.

## Video progress tracking

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/video-progress` | POST | Persists `{ videoId, currentTime, duration, completed }` to bridge customer metadata. |
| `/api/video-progress` | GET | Returns progress plus a precomputed `buttonText` (Start/Continue Learning, Watch Again). Optional `?videoId=` scopes the response. |

Progress lives on the bridge account only — the Legal Masterclass page (hosted on Readdy) is the sole consumer.

Full API contract: `docs/VIDEO_PROGRESS_API.md`.

## Trial user batch import

`scripts/add-trial-users.cjs` bulk-creates trial subscriptions from a CSV.

```bash
node scripts/add-trial-users.cjs "path/to/file.csv"
```

- Auto-detects `email` / `first` / `last` columns from headers
- 20 concurrent requests, normalizes emails to lowercase, skips existing subscribers
- Writes `trial-users-success-*.csv` and `trial-users-errors-*.csv` next to the input

Result CSVs contain customer PII and are gitignored.

## Infrastructure

- `ecs-terraform/` — ECS/Terragrunt module for an alternative deploy path.
- `.railwayignore` — keeps non-runtime files out of the Railway build context.
- `.gitignore` — now excludes:
  - `scripts/trial-users-*.csv` (PII)
  - `scripts/setup-railway-env.bat`, `scripts/toggle-stripe.bat` (contain Stripe secret keys)

## Development

```bash
npm install
npm run dev:all   # frontend + backend
```

## Deploy

```bash
railway up
```
