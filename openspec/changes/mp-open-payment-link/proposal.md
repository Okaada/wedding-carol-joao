## Why

The Mercado Pago API integration (access token, Preferences API, webhook, retry/error machinery, PIX fallback panic mode) is heavier than this wedding site actually needs. Token rotation, webhook URL maintenance, and credential drift have already produced enough operational pain to justify a parallel `pix-fallback-mode` capability — itself a workaround for API flakiness. Mercado Pago offers a public "Link de Pagamento" (`https://link.mercadopago.com.br/<slug>`) that requires zero API plumbing on our side: the couple already owns one (`presentecarolejoao`). The trade-off (the payer types the gift amount manually; gift status must be reconciled by the admin) is acceptable given the low gift volume of a one-off wedding and the operational simplicity gained.

## What Changes

- **BREAKING**: Remove the API-based Mercado Pago checkout. `purchaseMode: "mercadopago"` gifts no longer redirect to a per-gift `init_point` URL generated via `Preference.create`. Instead, the claim modal shows the gift amount prominently with a "Copiar valor" button and a CTA that opens the shared open payment link in a new tab. The payer pastes the amount in Mercado Pago manually.
- **BREAKING**: The MP webhook (`/api/webhooks/mercadopago`) is deleted. Gift status is no longer updated automatically when a payment is approved.
- **BREAKING**: The `MERCADOPAGO_ACCESS_TOKEN` env var, the `mercadopago` SDK dependency, and `src/lib/mercadopago.ts` are removed.
- **NEW**: A `pending_payments` collection records each buyer intent — `{ giftId, buyerInfo, amount, createdAt, status: "pending" | "confirmed" | "cancelled" }` — created when the buyer confirms the claim modal, before redirect.
- **NEW**: A `/admin/pending-payments` view lists pending intents alongside the matching gift, with **Confirmar** (marks the gift purchased and writes the `Purchase` record, mirroring what the webhook used to do) and **Cancelar** actions. Admin reconciles against the Mercado Pago dashboard.
- **NEW**: The shared open payment link URL is stored in the `settings` collection (`key: "mercadopago_payment_link"`, value `{ url: string }`) and editable from `/admin/settings`. Default seed: `https://link.mercadopago.com.br/presentecarolejoao`.
- **REMOVED**: `pix-fallback-mode` capability and the panic-mode machinery (`isPanicModeActive`, `mp_errors` collection, `PanicModeModeSelector`, the in-flight `panic-mode-tri-state` change). PIX fallback existed specifically to mask MP API failures; without the API there is nothing to fall back from. PIX as a first-class `purchaseMode: "pix"` is untouched.
- The reservation logic for `singlePurchase` gifts is retained but its trigger moves: a gift is reserved when a `pending_payments` row is created (not when MP redirects), and is released either by admin Cancel, by manual confirmation, or by a TTL sweep (existing `releaseExpiredReservations`).

## Capabilities

### New Capabilities
- `mp-open-link-checkout`: Captures buyer intent, redirects to the shared Mercado Pago open payment link with the amount shown for manual entry, and reconciles via admin-confirmed `pending_payments`.

### Modified Capabilities
- `gift-buyer-tracking`: Buyer info (`buyerType`, `buyerName`, `buyerNames`) is captured in the `pending_payments` row at intent time rather than encoded into MP's `external_reference` and decoded by the webhook. The `Purchase` record written on admin confirmation is identical in shape; `source` becomes `"mercadopago-open-link"`.
- `gift-multi-purchase`: Multi-purchase gifts accept multiple concurrent `pending_payments` rows (no reservation). The `Purchase` array is appended on admin confirmation rather than on webhook receipt.
- `pix-fallback-mode`: Capability is **removed**. All its requirements are deleted; the `mp_errors` collection, the panic-mode toggle, and the auto-trigger are gone. PIX-only gifts (`purchaseMode: "pix"`) continue to work via their independent flow.

## Impact

**Conflicts with in-flight work**: This change supersedes the `openspec/changes/panic-mode-tri-state/` change. That change adds a tri-state selector for a capability we are now removing. Both proposals should not be applied; pick one. Recommendation: archive `panic-mode-tri-state` without implementing, then apply this change.

**Code**:
- Removed: `src/app/api/webhooks/mercadopago/route.ts`, `src/lib/mercadopago.ts`, `src/lib/mp-errors.ts`, `src/lib/panic-mode.ts`, `src/components/admin/PanicModeModeSelector.tsx` (and the older `PanicModeToggle.tsx` if still tracked), `src/lib/external-reference.ts` (only if no remaining caller — verify).
- Rewritten: `src/app/api/gifts/[id]/checkout/route.ts` — no MP SDK call; creates a `pending_payments` doc, returns `{ paymentLinkUrl, amount, pendingId }`.
- Rewritten: `src/components/ClaimModal.tsx` — `mercadopago` mode renders amount + copy button + "Abrir link Mercado Pago" CTA instead of submitting and waiting for an `init_point`.
- Rewritten: `src/app/actions/admin-settings.ts` — drop `setPanicMode`/`togglePanicMode`; add `setMercadopagoPaymentLink(url)`.
- Rewritten: `src/app/admin/settings/page.tsx` — drop panic-mode block; add a single input for the payment link URL.
- Added: `src/app/admin/pending-payments/page.tsx`, server actions `confirmPendingPayment(id)` and `cancelPendingPayment(id)`.
- Added: `src/lib/pending-payments.ts` (CRUD + confirm-to-purchase logic that mirrors the old webhook's single-purchase vs. multi-purchase branching).

**Data**:
- New collection: `pending_payments`. Indexes on `giftId` and `status`.
- Deprecated collections: `mp_errors` (drop after deploy), `settings.panic_mode` doc (leave in place, ignored).
- New `settings` doc: `{ key: "mercadopago_payment_link", value: { url } }`.

**Dependencies / env**:
- `package.json`: remove `mercadopago` SDK.
- Env: `MERCADOPAGO_ACCESS_TOKEN` becomes unused and should be removed from `.env*` and any deploy secret store.

**Trust model**:
- A buyer can claim a gift without ever paying (creates a pending row that admin must verify against the MP dashboard). This is acceptable for a one-off wedding with low volume but is a real regression vs. the webhook-confirmed flow. Documented as such in `design.md`.
