## Why

The `mp-open-payment-link` change (archived 2026-07-22, already live in production) traded the Mercado Pago Preference API for a shared open payment link specifically to eliminate token/webhook operational pain. That trade-off holds: it was the right call at the time, and it stays as the default. It is not being removed by this change.

The couple has decided the manual reconciliation cost (buyer types the amount by hand, admin must eyeball the MP dashboard to confirm every gift) is worse than the token/webhook maintenance it was meant to avoid, now that the volume of gifts is picking up as the date approaches. João (the groom) is going to generate a Checkout Pro application (access token + a webhook secret) in the Mercado Pago dashboard and send the values over once created — they are not available yet.

## What Changes

- **NEW**: A `mercadopago_checkout_pro_enabled` boolean flag, stored in `settings` and toggled from `/admin/settings`, turns on a second checkout path that creates a real Mercado Pago `Preference` per gift and redirects the buyer straight into MP's hosted checkout (Checkout Pro), instead of the copy-the-amount open-link flow.
- **NEW**: `/api/webhooks/mercadopago` returns, this time with `x-signature`/`x-request-id` HMAC verification (the previous implementation, before it was deleted, had none — that gap is not being reintroduced). On an approved payment it confirms the matching `pending_payments` row automatically, recording the real MP `paymentId`.
- **NOT removed, NOT bypassed**: the `pending_payments` collection, the open-link checkout response shape, and `/admin/pending-payments` stay exactly as they are today. Checkout Pro is layered on top of them, not instead of them — every Checkout Pro checkout still creates a `pending_payments` row first, using its Mongo id as the MP `external_reference`. This means: (a) no separate buyer-info-encoding scheme is needed (the `external-reference.ts` base64/200-char hack from the old implementation is not resurrected), and (b) if the webhook never arrives, or credentials break, or the flag gets turned back off, the admin's existing "Confirmar/Cancelar" screen still works unmodified as the fallback reconciliation path.
- **NEW**: `src/lib/mercadopago.ts` is recreated, but its config getter no longer throws at call time when the token is missing — callers check for `null` and fall back gracefully.
- **Behavioral guarantee**: with the flag off, or the flag on but `MERCADOPAGO_ACCESS_TOKEN` unset, or a Preference-creation call failing for any reason, the checkout endpoint falls back to today's open-link response. The guest is never blocked by a Mercado Pago outage or a misconfigured credential — this is the direct fix for the exact pain (`mp_errors`/panic-mode complexity) the previous change spent effort building and then deleted.
- **Secrets stay out of the database**: `MERCADOPAGO_ACCESS_TOKEN` and `MERCADOPAGO_WEBHOOK_SECRET` are environment variables only, set in the deploy platform's secret store. The admin settings screen shows a read-only "chave configurada: sim/não" indicator (no way to paste a token into a form field that would land in MongoDB in plaintext). The flag can be switched on before the keys exist; it simply has no effect until the token is present.

## Capabilities

### New Capabilities
- `mp-checkout-pro`: Feature-flagged Mercado Pago Preference API checkout with signature-verified webhook auto-confirmation, built on top of the existing `pending_payments` intent record instead of a parallel data model.

### Modified Capabilities
- `mp-open-link-checkout`: The "Mercado Pago API integration is removed" requirement is replaced — the SDK and a webhook route return, but only take effect when the new flag is on and a token is configured. The checkout endpoint gains a conditional branch; its open-link response shape and all existing scenarios are unchanged when Checkout Pro is inactive.
- `gift-buyer-tracking`, `gift-multi-purchase`: `Purchase.paymentId` can once again hold a real Mercado Pago transaction id (set by the webhook), in addition to `null` (manual admin confirmation). No change to when/how `purchases[]` entries are created.

## Impact

**Code**:
- Added: `src/lib/mercadopago.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/components/admin/MercadopagoCheckoutProToggle.tsx`.
- Modified: `src/app/api/gifts/[id]/checkout/route.ts` (conditional Preference creation + fallback), `src/lib/pending-payments.ts` (`confirmPendingPayment` accepts an optional `paymentId`, adds `mpPreferenceId` tracking field), `src/lib/settings.ts` (flag getter + config-presence check), `src/app/actions/admin-settings.ts` (`setMercadopagoCheckoutProEnabled`), `src/app/admin/settings/page.tsx` (renders the toggle + status), `src/components/ClaimModal.tsx` (redirects immediately when the checkout response carries a direct `checkoutUrl` instead of showing the copy-the-amount stage).
- Dependencies: `mercadopago` SDK added back to `package.json`.

**Data**: no schema migration. `pending_payments` gains an optional `mpPreferenceId` field, written only for Checkout Pro attempts. `settings` gains one new document: `{ key: "mercadopago_checkout_pro", value: { enabled: boolean } }`.

**Env / secrets**: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL` — none of these exist yet in this deploy. Until João sends the credentials, the flag has no effect regardless of its stored value.

**Trust model change**: this is a partial improvement over the pure open-link flow — payments are now auto-confirmed only after MP's own signature-verified webhook approves them, closing the "buyer claims a gift and never pays, admin has to notice" gap for whichever gifts actually complete a Checkout Pro payment. It does not reach the old (pre-`mp-open-payment-link`) trust level for gifts where the webhook is delayed or dropped — those still sit in `pending_payments` until the admin reconciles manually or the webhook retry (MP retries every 15 minutes) eventually lands.

**Rollback**: flip the flag off in `/admin/settings`. No deploy needed, no data cleanup — the open-link flow resumes immediately for all new checkouts.
