## Context

Three prior states exist in this codebase's history for Mercado Pago:

1. **Checkout Pro (original, deleted)**: Preference API per checkout, webhook at `/api/webhooks/mercadopago` with **no signature verification**, buyer info for multi-purchase gifts smuggled into `external_reference` as `<giftId>|<base64url(JSON)>` (capped at 200 chars), and a whole `pix-fallback-mode` "panic mode" subsystem (`mp_errors` collection, auto-trigger at 3 errors/day, admin toggle) built specifically to paper over MP API flakiness.
2. **Open payment link (current production)**: no MP API at all. `pending_payments` collection records buyer intent before redirecting to a shared, couple-owned open payment link; admin manually confirms against the MP dashboard from `/admin/pending-payments`.
3. **This change**: Checkout Pro comes back, but as an optional layer on top of (2), not a reversion to (1). The `pending_payments` infrastructure — already shipped, already the thing the admin looks at — becomes the system of record for buyer intent regardless of which checkout path fired. The webhook, this time, exists purely to auto-confirm those rows instead of writing to the gift document directly, and it verifies MP's signature before touching anything.

## Goals / Non-Goals

**Goals:**
- Give guests a one-tap MP checkout (no manual amount entry) whenever the flag is on and credentials are present.
- Never regress the guest experience when credentials are absent, invalid, or MP is down — always fall back to the open-link flow that already works.
- Verify webhook authenticity. The deleted implementation trusted any POST to the webhook URL; that is a real vulnerability (anyone who discovers the URL could POST a fake "approved" body and mark a gift purchased for free, or worse, target `singlePurchase` gifts to grief other buyers by faking approvals for gifts they don't own). This is not a return the previous implementation should get a pass on repeating.
- Keep the access token and webhook secret out of MongoDB entirely. They are the kind of secret that data-privacy hardening in this repo (`gift-data-privacy`, `secure-csv-export` changes) has otherwise been careful about — no reason to make an exception for MP credentials.
- No new "mode" bifurcation on `Gift.purchaseMode`. The flag is global (one admin setting), not per-gift, matching what was asked for.

**Non-Goals:**
- Multiple concurrent MP applications / multi-tenant credentials. One access token, one webhook secret, one deploy.
- Resurrecting `mp-errors.ts` / panic-mode / auto-fallback-on-N-errors. The per-request try/catch fallback in the checkout route (§ Decision 3) already achieves the outcome that subsystem existed for, without the extra state machine.
- Pre-warming or caching the MP SDK client across requests beyond what the SDK itself does — traffic volume here is low (a wedding gift list), this is not a perf-sensitive path.
- Handling `orders`/`merchant_order`/other webhook topics. Only the `payment` topic is consumed, matching what Checkout Pro actually needs.

## Decisions

### 1. `pending_payments._id` becomes the MP `external_reference`, not a re-encoded buyer payload

The old implementation needed to smuggle buyer info through MP because it had nowhere else to put it — no local record existed before redirect. That's no longer true: `createPendingPayment()` already exists and already runs before redirect for the open-link flow. Reusing it for Checkout Pro means:
- `external_reference` is just the pending row's Mongo `ObjectId` as a string — no base64, no 200-char budget, no encode/decode pair to maintain.
- The webhook's only job is: verify signature → fetch the payment → if `status === "approved"`, look up `pending_payments` by `_id: external_reference` → call `confirmPendingPayment(pendingId, { paymentId })`.
- `confirmPendingPayment` already exists and is exercised today by the admin's manual "Confirmar" button. Adding an optional `paymentId` argument (default `null`, unchanged for the manual path) means the webhook and the admin UI share one code path instead of two divergent ones. This is the main structural win over redoing the 2026-04 implementation from scratch.

**Alternative considered**: keep `external_reference: giftId` (legacy behavior) and look up the newest pending row for that gift. Rejected — ambiguous under concurrent multi-purchase checkouts (which pending row does an approval belong to?), which is exactly the bug class `pending_payments` id-based lookup avoids for free.

### 2. Webhook signature verification, fail-closed

Mercado Pago signs webhook bodies via the `x-signature` header (`ts=<unix>,v1=<hex hmac>`) and `x-request-id` header. The manifest string to HMAC-SHA256 is `id:{data.id};request-id:{x-request-id};ts:{ts};`, where `data.id` is read from the `data.id` **query string parameter** MP appends to the notification URL (not the JSON body) — confirmed against MP's current webhook docs. The official `mercadopago` Node SDK ships `WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId, secret })`, which is used here instead of a hand-rolled HMAC comparison (avoids re-implementing timing-safe comparison and manifest formatting by hand).

If `MERCADOPAGO_WEBHOOK_SECRET` is not set, the webhook route returns `401` and does nothing — **fail closed**, not open. An unauthenticated webhook that "processes anyway" while pretending everything is fine is worse than one that visibly rejects everything until configured.

**Alternative considered**: accept unsigned webhooks when the secret isn't set yet (softer bring-up experience while João finishes MP dashboard setup). Rejected — a public POST endpoint that trusts its body by default is precisely the gap being fixed; the admin can always confirm manually via `/admin/pending-payments` in the interim, so nothing is actually blocked by failing closed.

### 3. Checkout route: try Checkout Pro, fall back to open-link on any failure

```
pendingId = createPendingPayment(...)          // unchanged, always runs
if (flag enabled && ACCESS_TOKEN present) {
  try {
    preference = Preference.create({ external_reference: pendingId, notification_url: `${BASE_URL}/api/webhooks/mercadopago`, ... })
    return { checkoutUrl: preference.init_point, amount, pendingId }   // new shape
  } catch {
    // log server-side, do NOT surface a 500 to the guest
  }
}
return { paymentLinkUrl: await getMercadopagoPaymentLink(), amount, pendingId }   // existing shape, unchanged
```

The reservation logic for `singlePurchase` gifts (atomic `findOneAndUpdate`, 409 on conflict) is untouched and runs before either branch — it does not know or care which checkout path eventually fires.

Setting `notification_url` explicitly per-Preference (rather than relying solely on the account-level URL configured in MP's "Your Integrations" dashboard) means the webhook target is driven by `NEXT_PUBLIC_BASE_URL`, not a manual dashboard field the groom could forget to update if the deploy URL ever changes. He still needs one one-time dashboard step — opening "Webhooks > Configurar notificação" and enabling the `payment` topic — because that is where MP generates the signing secret, independent of where the URL itself is configured.

**Alternative considered**: fail the guest's checkout with a 500 when Preference creation errors, matching the original implementation. Rejected for the same reason panic-mode existed in the first place — a guest should never see a dead end because of an MP-side or credential problem when a working fallback path already exists one function call away.

### 4. ClaimModal branches on response shape, not on a new explicit "mode" prop

The checkout response now has two shapes: `{ checkoutUrl, amount, pendingId }` (Checkout Pro — redirect immediately via `window.location.href`) or `{ paymentLinkUrl, amount, pendingId }` (open-link — render the existing copy-the-amount stage). `ClaimModal` picks based on which key is present rather than a caller-supplied flag, so the buyer always gets whichever path the server actually used for that specific request — including the fallback case from Decision 3, without the client needing to know a fallback happened.

### 5. Flag storage and secret handling

`settings.mercadopago_checkout_pro = { enabled: boolean }`, admin-editable, mirrors the existing `mercadopago_payment_link` pattern (`getMercadopagoPaymentLink` / `setMercadopagoPaymentLink`) for consistency. `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET` are read only from `process.env` — never accepted as form input, never written to `settings`. The admin settings page calls a small server-only `isMercadopagoConfigured()` helper that returns a boolean (token present / absent) so the UI can say "chave não configurada ainda — o link de pagamento seguirá sendo usado" without ever touching the secret's value.

## Risks / Trade-offs

- **[Webhook delayed or dropped]** → Row stays `pending` until MP's retry (every 15 min, per their docs) succeeds or the admin confirms manually from `/admin/pending-payments` — the exact same page already in daily use. No new failure mode introduced; it degrades to the current production behavior.
- **[João sends a test-mode token instead of production]** → Test-mode payments won't reflect real money but will still "confirm" gifts. Mitigated by: `isMercadopagoConfigured()` cannot distinguish test vs. prod tokens (MP's token format does encode this, `TEST-...` vs a production token — worth a lightweight startup warning if a `TEST-` prefixed token is detected while the flag is on, logged server-side only). Flagged as a task below.
- **[Flag flipped on before the token exists]** → No-op by design (Decision 3); every checkout silently uses the open-link fallback. Considered acceptable — better than requiring the admin to sequence "add token" before "flip flag" correctly.
- **[Two `settings` toggles now control MP behavior — the link URL and the Checkout Pro flag]** → Slight admin UI complexity increase. Accepted; both are one checkbox / one input field, and the settings page already groups them under one "Mercado Pago" section.
- **[`notification_url` requires `NEXT_PUBLIC_BASE_URL` to be correct]** → If unset or wrong, MP has nowhere to deliver the webhook and every Checkout Pro payment silently falls back to manual reconciliation (webhook never arrives, but the guest still completed a real MP checkout). Mitigated by: `NEXT_PUBLIC_BASE_URL` documented in `.env.example`; verification task added below to confirm it's set before the flag is switched on in production.

## Migration Plan

1. Apply this change (code). Flag defaults to `false`; nothing behaves differently until an admin opts in.
2. João generates the Checkout Pro application in the MP dashboard, sends: access token (prefer production, not `TEST-`), and enables webhook notifications for the `payment` topic to get the signing secret.
3. Add `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL` to the deploy platform's env/secret store. Redeploy (env vars require a restart to be picked up).
4. Admin opens `/admin/settings`, confirms the status line shows "chave configurada: sim", flips the Checkout Pro toggle on.
5. Do one real low-value test purchase end-to-end before relying on it for guest traffic; confirm the `pending_payments` row transitions to `confirmed` automatically and `paymentId` is populated with a real MP id.

**Rollback**: flip the toggle off. No env changes, no data changes, no deploy required.

## Open Questions

- **OQ1**: Should `mpPreferenceId` (stored on the pending row when a Preference is created) be surfaced in `/admin/pending-payments` for debugging? Leaning yes, small addition, deferred to implementation.
- **OQ2**: Is `NEXT_PUBLIC_BASE_URL` already set in the current deploy for any other purpose? Grep during implementation — the old checkout route referenced it for `back_urls`; if it survived cleanup it may already be configured.
- **OQ3**: Does the couple want Checkout Pro to be the default checkout button (guest doesn't choose) or should the guest see a choice between "Checkout Pro" and "Link aberto"? This proposal assumes the former (server decides transparently) since that's simpler and matches "uma flag" (singular) as requested. Confirm before enabling in production.
