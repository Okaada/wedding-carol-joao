## Why

Two public, unauthenticated write endpoints accept arbitrary input with no rate limiting, no abuse protection, and no bound on payload size:

- `POST /api/gifts/[id]/claim` — for multi-purchase gifts it does an unbounded `$push` to `purchases[]`. A loop can inflate a single gift document toward MongoDB's 16 MB BSON ceiling (data-pollution / DoS), and for single-purchase gifts an attacker can mark a gift `claimed` without paying (griefing).
- `POST /api/gifts/[id]/checkout` — each call inserts a `pending_payments` row and, for single-purchase gifts, flips the gift to `reserved`. A loop can fill the collection and **reserve every single-purchase gift at once**, making the whole list unbuyable for 30 minutes (renewable indefinitely). The existing `releaseExpiredReservations()` (30 min) does not stop a sustained loop.

Neither endpoint caps `buyerNames[]` length or individual name length, so a request can also push oversized arrays/strings.

These are public by design (guests are not logged in), so the fix is abuse protection, not authentication.

## What Changes

- Add **per-IP rate limiting** to `claim` and `checkout`, reusing the MongoDB-backed counter+TTL pattern already built for login (`login_attempts`).
- Add **input bounds**: cap `buyerNames[]` length (e.g. ≤ 20) and each name's length (e.g. ≤ 80 chars); reject oversized request bodies.
- Add a **per-IP cap on active pending intents** so a single client cannot reserve the entire catalog.
- Add **anti-automation** on the reservation/claim path (lightweight challenge or proof-of-work-free heuristic, e.g. minimum interval per IP per gift) without harming the guest UX.

## Capabilities

### New Capabilities
- `public-write-protection`: Rate limiting, input bounds, and abuse caps for the unauthenticated gift `claim` and `checkout` endpoints.

### Modified Capabilities
<!-- Behavior of the happy-path claim/checkout flows is unchanged; this adds rejection paths for abusive traffic. -->

## Impact

- **Code**: `src/app/api/gifts/[id]/claim/route.ts`, `src/app/api/gifts/[id]/checkout/route.ts`, plus a shared helper (e.g. `src/lib/rate-limit.ts`) generalizing the existing login counter logic in `src/lib/auth-utils.ts`.
- **Database**: One new TTL collection for request counters (e.g. `write_rate_limits`), keyed by `ip`+`route` (or `ip`+`giftId`). No change to `gifts`/`pending_payments` schema.
- **APIs**: New `429 Too Many Requests` and `400` (oversized/invalid input) responses; happy path unchanged.
- **Severity**: HIGH — these enable cheap denial-of-service and data pollution against the live gift list.
