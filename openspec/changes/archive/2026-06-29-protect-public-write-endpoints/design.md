## Context

The gift `claim` and `checkout` endpoints are intentionally public — guests are never authenticated. The app runs on Vercel (serverless), so in-process counters do not survive across invocations; the login flow already solved the equivalent problem with a MongoDB collection (`login_attempts`) + TTL index (see `src/lib/auth-utils.ts`). We reuse that pattern rather than introducing Redis.

Client IP is read the same way the login flow reads it: `request.headers.get("x-forwarded-for")` (first hop), falling back to `"unknown"`.

Current abuse surface:
- `claim` (multi-purchase): `$push` to `purchases[]` with no cap → document growth toward 16 MB.
- `claim` (single-purchase): griefing via `status: "claimed"` without payment.
- `checkout`: unbounded `pending_payments` inserts + mass `reserved` of single-purchase gifts.

## Goals / Non-Goals

**Goals:**
- Make automated abuse of `claim`/`checkout` expensive enough to be impractical, without adding friction for a real guest doing one purchase.
- Bound all guest-controlled input sizes.
- Reuse existing MongoDB+TTL infrastructure; no new runtime dependency.

**Non-Goals:**
- Authenticating guests (the flow is public by design).
- CAPTCHA integration as a hard dependency (kept as an optional escalation, not the baseline).
- Changing the payment reconciliation model (still manual admin confirmation).
- Fixing the PII leak (separate change `harden-public-data-exposure`).

## Decisions

### 1. MongoDB-backed per-IP rate limiter, generalized from the login counter

**Choice**: Extract a generic `checkRate({ key, max, windowSeconds })` helper backed by a `write_rate_limits` collection with a TTL index, and key it by `ip + ":" + route` (and `ip + ":" + giftId` for the reservation cap).

**Rationale**: Identical operational characteristics to `login_attempts` (serverless-safe, self-cleaning). One helper keeps the two endpoints consistent.

**Limits (initial, tunable):** `claim` and `checkout` → 10 requests / 10 min per IP per route; reservation cap → max 5 active single-purchase reservations per IP.

**Alternatives considered**:
- Redis/Upstash — new dependency for a low-traffic wedding site.
- Edge middleware rate limit — middleware matcher currently only covers `/admin`; extending it to `/api` is possible but the per-gift/per-route logic is clearer in the handler.

### 2. IP is best-effort, not a security boundary

**Choice**: Treat `x-forwarded-for` as a soft signal. Combine the IP limit with input bounds and the active-reservation cap so that even a rotating-IP attacker cannot inflate a single document or reserve the whole catalog cheaply.

**Rationale**: Behind Vercel's proxy, XFF is generally trustworthy for the client hop, but spoofing/NAT exists. Defense in depth (caps + bounds) limits blast radius regardless of IP fidelity.

### 3. Input bounds enforced before any DB write

**Choice**: Reject the request with `400` if `buyerNames.length > 20`, any name length > 80, or `buyerName` length > 80. Read the body with a size guard.

**Rationale**: Stops oversized-array and oversized-string abuse at the edge of the handler, independent of rate limiting.

### 4. Reservation cap keyed by IP

**Choice**: Before reserving a single-purchase gift in `checkout`, count active `pending_payments` (status `pending`) attributable to the IP within the reservation window; reject with `429` over the cap.

**Rationale**: Directly defeats the "reserve every gift" DoS without blocking a normal guest buying one or two gifts.

## Risks / Trade-offs

- **[Shared/NAT IPs]** Multiple legitimate guests behind one IP could hit the limit → Limits set generously (10/10min) relative to real human behavior; revisit with audit data.
- **[TTL lag]** TTL purge runs ~every 60 s, so counters may linger slightly → Acceptable; not a real-time system.
- **[XFF spoofing]** Mitigated by pairing IP limits with input bounds and reservation caps (decision 2).
- **[Added latency]** One extra indexed Mongo read per write request → Negligible; the endpoints already do multiple round-trips.
