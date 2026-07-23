## 1. Env & dependencies

- [x] 1.1 Add `mercadopago` back to `package.json` dependencies; run install to regenerate the lockfile. _(Pinned `^3.2.0`, not the previous `^2.12.0` — the v3 line ships `WebhookSignatureValidator`/`InvalidWebhookSignatureError` needed for task 6.2, with the same `MercadoPagoConfig`/`Preference`/`Payment` constructor shapes as before. Used `--force` for the pre-existing `@tailwindcss/oxide-linux-x64-gnu` platform pin, same as the prior change.)_
- [x] 1.2 Add `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL` to `.env.example` with comments explaining each is required only when the Checkout Pro flag is enabled, and none are committed with real values.
- [x] 1.3 Grep for any surviving reference to `NEXT_PUBLIC_BASE_URL` from the pre-open-link implementation to confirm whether it's already wired anywhere (OQ2 in design.md). _(No hits anywhere in `src/` before this change — it does not exist in the current deploy. Must be set before the flag is switched on in production, or webhooks have nowhere to be delivered.)_

## 2. Mercado Pago client

- [x] 2.1 Recreate `src/lib/mercadopago.ts`. `getConfig()` returns `null` (not throw) when `MERCADOPAGO_ACCESS_TOKEN` is unset. `getPreferenceClient()` / `getPaymentClient()` return `null` when config is `null`. Export `isMercadopagoConfigured(): boolean`.
- [x] 2.2 Log a one-time server-side warning if the configured token starts with `TEST-`.

## 3. Settings: feature flag

- [x] 3.1 `getMercadopagoCheckoutProEnabled()` added to `src/lib/settings.ts`.
- [x] 3.2 `setMercadopagoCheckoutProEnabled()` added to `src/app/actions/admin-settings.ts`.
- [x] 3.3 `MercadopagoCheckoutProToggle.tsx` created with the configured/not-configured status line.
- [x] 3.4 Wired into `/admin/settings` below `MercadopagoLinkForm`.

## 4. Pending payments: paymentId support

- [x] 4.1 `confirmPendingPayment(pendingId, opts?: { paymentId?: string })` — existing manual-confirm callers unaffected (param optional, defaults to `null`).
- [x] 4.2 `attachMpPreference(pendingId, preferenceId)` added; `mpPreferenceId?: string` added to the pending doc shape.

## 5. Checkout endpoint: conditional Checkout Pro branch

- [x] 5.1 `tryCreateCheckoutProPreference()` added to `src/app/api/gifts/[id]/checkout/route.ts`, called after the existing (unchanged) reservation + `createPendingPayment`.
- [x] 5.2 On success: `attachMpPreference` + `{ checkoutUrl, amount, pendingId }`.
- [x] 5.3 On any failure: `console.error`, falls through to the existing `{ paymentLinkUrl, amount, pendingId }` response. No rollback of the reservation or pending row.
- [x] 5.4 Traced in code review: with the flag off, `tryCreateCheckoutProPreference` returns `null` after one `settings` read (same as the existing `getMercadopagoPaymentLink` read pattern already on this route) — no MP network call, response shape unchanged. _(Not exercised against a running dev server — no MongoDB reachable from this sandbox. `npx tsc --noEmit` passes; live regression check is task 8.2.)_

## 6. Webhook endpoint

- [x] 6.1 `src/app/api/webhooks/mercadopago/route.ts` created. Returns `401` immediately when `MERCADOPAGO_WEBHOOK_SECRET` is unset.
- [x] 6.2 Signature validated via the SDK's `WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId, secret, toleranceSeconds })`, with a 5-minute replay-tolerance window (not in the original task wording — added because the SDK exposes it for free). `dataId` read via `new URL(request.url).searchParams.get("data.id")` (the route handler receives a standard `Request`, not `NextRequest`, so `request.nextUrl` isn't available — functionally identical).
- [x] 6.3 Body size capped at 16KB before parsing.
- [x] 6.4 Non-`payment` topics ack `200` immediately.
- [x] 6.5 Fetches via `getPaymentClient().get({ id: dataId })`; non-`approved` status acks `200` and stops.
- [x] 6.6 / 6.7 Lookup + idempotency handled by `confirmPendingPayment` itself (a `"confirmed"` row no longer matches its `status: "pending"` query filter, so a duplicate delivery is a safe no-op) rather than a separate pre-check — same outcome, less duplicated logic.
- [x] 6.8 Calls `confirmPendingPayment(pendingId, { paymentId: String(payment.id) })`.
- [x] 6.9 Rate-limited via `checkRate` (60 req/min per IP) as defense-in-depth alongside signature verification.

## 7. ClaimModal: redirect for Checkout Pro responses

- [x] 7.1 Response typed as a discriminated union (`{ checkoutUrl, amount, pendingId }` or `{ paymentLinkUrl, amount, pendingId }`); component state only ever holds the open-link shape since the Checkout Pro branch redirects and returns before `setMpCheckout` would run.
- [x] 7.2 `window.location.href = data.checkoutUrl` on the Checkout Pro branch.
- [x] 7.3 Open-link branch (`MpStageTwo`) unchanged.
- [x] 7.4 Traced in code review — the `"checkoutUrl" in data` branch is only reachable when the server actually returned that shape, which task 5.4 established only happens when the flag is on and configured. _(Not exercised against a running app in this sandbox; live regression check is task 8.2.)_

## 8. Verify

- [x] 8.1 `npx tsc --noEmit` clean. `npm run lint`: zero new errors/warnings from this change's files; the two pre-existing errors (`ConstructionBanner.tsx`, `Countdown.tsx`) and the pre-existing `img`/unused-prop warnings are untouched by this change (same two files flagged in the prior archived change's verification notes). `npm run build` could not be exercised in this sandbox — Turbopack's Google Fonts fetch (`fonts.googleapis.com`) is network-blocked here; unrelated to this change.
- [ ] 8.2 With the flag off and no `MERCADOPAGO_ACCESS_TOKEN` set: manual — requires a reachable MongoDB + running dev server, neither available in this sandbox.
- [x] 8.3 `git grep -n "MERCADOPAGO_ACCESS_TOKEN\|MERCADOPAGO_WEBHOOK_SECRET"` — both appear only as `process.env` reads (`src/lib/mercadopago.ts`, the webhook route) and once as plain UI copy text in `MercadopagoCheckoutProToggle.tsx`; never as a `settings` write target or form field.
- [ ] 8.4 Manual (post-credentials, requires João's token + a running deploy).
- [ ] 8.5 Manual (post-credentials, requires a deployed webhook URL).
