## 1. Shared rate-limit helper

- [x] 1.1 Create `src/lib/rate-limit.ts` with `checkRate({ key, max, windowSeconds })` backed by a `write_rate_limits` collection, mirroring the `login_attempts` upsert+`$inc` pattern in `src/lib/auth-utils.ts`
- [x] 1.2 Ensure a TTL index on `write_rate_limits` (expire after the window) via the existing `ensureSecurityIndexes()` path or an equivalent init
- [x] 1.3 Add a `getClientIp(request)` util reading `x-forwarded-for` (first hop), defaulting to `"unknown"`

## 2. Input bounds

- [x] 2.1 In both endpoints, after parsing the body, reject with `400` when `buyerNames.length > 20`, any `buyerNames[i]` length > 80, or `buyerName` length > 80
- [x] 2.2 Guard against oversized bodies (reject early if content length / parsed size is implausibly large)

## 3. Rate limit the claim endpoint

- [x] 3.1 In `src/app/api/gifts/[id]/claim/route.ts`, call `checkRate({ key: ip + ":claim", max: 10, windowSeconds: 600 })` before any DB write; return `429` with a Portuguese message when exceeded
- [x] 3.2 Confirm the multi-purchase `$push` path is unreachable in a tight loop once the limit is in place

## 4. Rate limit + reservation cap on checkout

- [x] 4.1 In `src/app/api/gifts/[id]/checkout/route.ts`, call `checkRate({ key: ip + ":checkout", max: 10, windowSeconds: 600 })` before reserving; return `429` when exceeded
- [x] 4.2 Before reserving a single-purchase gift, count this IP's active `pending` reservations; reject with `429` when ≥ 5
- [x] 4.3 Verify `releaseExpiredReservations()` still runs and that rejected requests create no `pending_payments` row

## 5. Verification

- [ ] 5.1 Script 30 rapid `claim` requests from one IP; confirm requests past the limit return `429` and `purchases[]` stops growing
- [ ] 5.2 Script repeated `checkout` on distinct single-purchase gifts from one IP; confirm the catalog cannot be fully reserved (cap enforced)
- [ ] 5.3 Send `buyerNames` with 1000 entries; confirm `400` and no DB write
- [ ] 5.4 Confirm a normal single purchase (one claim, one checkout) is unaffected
- [x] 5.5 `npm run lint` and `npm run build` pass
