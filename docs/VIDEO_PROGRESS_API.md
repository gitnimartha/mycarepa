# Video Progress Tracking API

Session date: 2026-05-13
Deployed: Railway (production), `https://api.mycarepersonalassistant.com`
Server file: `server.js`

## Summary

Added two endpoints so any frontend can persist a customer's video-watching
progress, and so other consumers (e.g. a "Start Learning" / "Continue Learning"
button on a different page) can read a ready-to-render status and button label
with a single GET request.

No new dependencies. No schema migration. Storage piggybacks on the existing
Stripe-customer-metadata pattern already used for `usage_log`, verification
codes, and `email_verified`.

---

## Endpoints

### `POST /api/video-progress`

Save (create or update) a customer's progress for a single video.

**Request body**

| Field         | Type    | Required | Notes                                              |
| ------------- | ------- | -------- | -------------------------------------------------- |
| `email`       | string  | yes      | Customer email (case-insensitive lookup in Stripe) |
| `videoId`     | string  | yes      | Stable identifier you choose for the video         |
| `currentTime` | number  | yes      | Seconds watched, `>= 0`                            |
| `duration`    | number  | yes      | Total video length in seconds, `>= 0`              |
| `completed`   | boolean | no       | Force-mark as completed; otherwise auto-derived    |

**Auto-completion:** If `completed` is not `true`, the server marks the video
completed when `currentTime / duration >= 0.95`.

**Response (200)**

```json
{
  "success": true,
  "customerId": "cus_UVYvywlFo3Eq6f",
  "videoId": "intro",
  "currentTime": 42,
  "duration": 300,
  "progress": 0.14,
  "completed": false,
  "status": "in_progress",
  "buttonText": "Continue Learning"
}
```

**Error responses**

| Status | Body                                              | Cause                                            |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| 400    | `{"error":"email and videoId are required"}`      | Missing required field                           |
| 400    | `{"error":"currentTime and duration must be non-negative numbers"}` | Non-numeric or negative input |
| 404    | `{"error":"No customer found for this email"}`    | No Stripe customer exists for this email yet    |
| 413    | `{"error":"Too many tracked videos for this customer"}` | Encoded JSON would exceed metadata byte cap |
| 500    | `{"error":"<stripe error message>"}`              | Upstream Stripe failure                          |

**Note:** A customer must already exist (trial or paid). The endpoint will not
auto-create one — that would pollute the Stripe customer list with marketing
visitors who never converted.

---

### `GET /api/video-progress`

Read a customer's video progress. Returns aggregate status plus a
button-ready label so buttons on any page can render directly without
computing state client-side.

**Query params**

| Param     | Type   | Required | Notes                                         |
| --------- | ------ | -------- | --------------------------------------------- |
| `email`   | string | yes      | Customer email                                |
| `videoId` | string | no       | If provided, scopes status/buttonText to one  |

**Aggregate response (no `videoId`)**

```json
{
  "email": "405531@yopmail.com",
  "customerId": "cus_UVYvywlFo3Eq6f",
  "status": "in_progress",
  "buttonText": "Continue Learning",
  "videos": {
    "intro": {
      "currentTime": 42,
      "duration": 300,
      "progress": 0.14,
      "completed": false
    },
    "big-buck-bunny": {
      "currentTime": 10,
      "duration": 10,
      "progress": 1,
      "completed": true
    }
  }
}
```

**Single-video response (`?videoId=intro`)**

```json
{
  "email": "405531@yopmail.com",
  "customerId": "cus_UVYvywlFo3Eq6f",
  "videoId": "intro",
  "status": "in_progress",
  "buttonText": "Continue Learning",
  "currentTime": 42,
  "duration": 300,
  "progress": 0.14,
  "completed": false
}
```

**Unknown email — consumer-friendly fallback (200, not 404)**

```json
{
  "email": "stranger@example.com",
  "status": "not_started",
  "buttonText": "Start Learning",
  "videos": {}
}
```

A button can always render — no error handling needed for "this user isn't
a customer yet."

**Error responses**

| Status | Body                                          | Cause              |
| ------ | --------------------------------------------- | ------------------ |
| 400    | `{"error":"email query param is required"}`   | Missing `email`    |
| 500    | `{"error":"<stripe error message>"}`          | Upstream failure   |

---

## Status & button-text rules

`status` is derived; never stored.

| Condition                                          | `status`      | `buttonText`        |
| -------------------------------------------------- | ------------- | ------------------- |
| No videos tracked for this customer                | `not_started` | `Start Learning`    |
| At least one video tracked, not all completed      | `in_progress` | `Continue Learning` |
| Every tracked video has `completed: true`          | `completed`   | `Watch Again`       |

For a single-video query, the same mapping is applied to that one video.

---

## Storage model

| Where                  | Stripe customer `metadata.video_progress` |
| ---------------------- | ----------------------------------------- |
| Shape                  | Compact JSON map, `{ "<videoId>": { "t": <currentTimeSec>, "d": <durationSec>, "c": 0\|1 } }` |
| Max videos per customer| 20 (oldest dropped on overflow)           |
| Byte cap               | 480 chars (Stripe metadata limit is 500)  |
| Completion threshold   | `>= 95%` of duration auto-marks completed |
| Persistence            | Survives Railway sleep/restart (Stripe-hosted) |

Trimming rule: when a write would push the entry count past 20, oldest entries
(by insertion order) are dropped to fit. If the encoded JSON would exceed 480
bytes the write is rejected with 413 instead of silently dropping data.

---

## CORS & auth

- **CORS:** existing policy in `server.js:134` is "allow all origins" — works
  for buttons on any external domain.
- **Auth:** none required. Anyone who knows an email can read or write that
  user's progress. Acceptable for non-sensitive button-text data; tighten
  later (e.g. require a verified session token) if needed.

---

## Trial user created during session

| Field          | Value                          |
| -------------- | ------------------------------ |
| Email          | `405531@yopmail.com`           |
| Name           | Martha Test                    |
| Customer ID    | `cus_UVYvywlFo3Eq6f`           |
| Subscription ID| `sub_1TWXnq5xKx3tEIjNsBsCqjD0` |
| Trial hours    | 3                              |

Used to exercise POST and verify end-to-end flow.

---

## Example curl

```bash
# Save progress
curl -X POST https://api.mycarepersonalassistant.com/api/video-progress \
  -H "Content-Type: application/json" \
  -d '{"email":"405531@yopmail.com","videoId":"intro","currentTime":42,"duration":300}'

# Read aggregate
curl "https://api.mycarepersonalassistant.com/api/video-progress?email=405531@yopmail.com"

# Read a single video
curl "https://api.mycarepersonalassistant.com/api/video-progress?email=405531@yopmail.com&videoId=intro"
```

---

## Files changed

- `server.js` — added `VIDEO_PROGRESS_*` constants, helpers
  (`decodeVideoProgress`, `expandVideo`, `deriveOverallStatus`,
  `buttonTextFor`), and the two routes; updated startup log to list them.

## Verification

- `GET /api/video-progress?email=deploy-check@example.com` → 200,
  `not_started` / `Start Learning` (unknown-email fallback).
- `POST` with the trial user → 200, `progress: 0.14`, `in_progress` /
  `Continue Learning`.
- `POST` with non-existent email → 404, `No customer found for this email`.
- `GET` round-trips the saved data correctly.
