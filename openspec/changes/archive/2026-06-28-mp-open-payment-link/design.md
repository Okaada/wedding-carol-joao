## Context

The current Mercado Pago integration creates a per-gift `Preference` via the MP SDK on every checkout, returns the `init_point` URL, and listens on `/api/webhooks/mercadopago` for approved payments to mark the gift `purchased` (or append to `purchases[]` for multi-purchase). It works, but it has produced ongoing operational friction:

- `MERCADOPAGO_ACCESS_TOKEN` lifecycle (test vs. production tokens, rotation, deploy-time misconfiguration).
- Webhook URL must be public and registered with MP; broken or stale URLs silently lose confirmations.
- Enough preference-creation failures occurred to justify building a `pix-fallback-mode` capability on top — an entire panic-mode subsystem with auto-triggers and admin toggles whose sole purpose is to mask MP API flakiness.
- An in-flight change (`panic-mode-tri-state`) is adding a `force-off` mode to that subsystem — more code piled on top of the workaround.

The couple already owns an open Mercado Pago payment link (`https://link.mercadopago.com.br/presentecarolejoao`). It has none of those problems: no token, no webhook, no API surface. The cost is that MP renders the payment screen with an empty amount field — the payer must type the value, and we lose the webhook-driven status update. We accept both costs and reconcile manually.

## Goals / Non-Goals

**Goals:**
- Remove every line of code whose sole reason for existing is the MP API integration (SDK, token, webhook, mp_errors logging, panic-mode toggle, pix-fallback machinery on MP gifts).
- Keep `purchaseMode: "mercadopago"` working from the buyer's perspective: they click "Presentear", see the gift amount clearly, get to a Mercado Pago payment screen in one tap.
- Give the admin a single place (`/admin/pending-payments`) to reconcile claimed-but-unverified intents against the MP dashboard and mark gifts purchased — preserving the data shape of `Purchase` records so historical and admin views don't change.
- Make the shared payment link URL configurable from `/admin/settings` (not hardcoded, not env-only), because the couple may rotate slugs.

**Non-Goals:**
- Pre-filling the amount on the MP screen. Not technically possible with open payment links.
- Server-to-server payment verification. We are explicitly trading webhook auto-confirmation for manual reconciliation.
- Touching the PIX-only flow (`purchaseMode: "pix"`). It is independent and stays as-is.
- Migrating historical `mp_errors` data or in-flight `settings.panic_mode` documents. The collections become inert and are left for archeology; no destructive cleanup script.
- Building a TTL sweep for `pending_payments`. The existing `releaseExpiredReservations` covers reserved single-purchase gifts; pending rows for multi-purchase gifts are cheap to leave around.

## Decisions

### 1. Capture buyer intent on our side BEFORE the redirect (don't blind-redirect)

When the buyer confirms the claim modal, the client POSTs to `/api/gifts/[id]/checkout` (route name retained for diff hygiene; the response shape changes). The route:
1. Validates the gift and the buyer fields.
2. For `singlePurchase: true`: atomic `findOneAndUpdate({ status: "available" }, { status: "reserved", ... })`. If it fails, return 409.
3. Inserts a `pending_payments` document: `{ giftId, buyerInfo, amount, status: "pending", createdAt }`.
4. Reads the shared payment link URL from `settings`.
5. Returns `{ paymentLinkUrl, amount, pendingId }` to the client.

**Alternative considered**: redirect to the open link with no server-side record. Rejected — the admin would have no list to reconcile against, would lose the buyer-info-to-gift mapping that the old `external_reference` provided, and would have to compare MP dashboard transactions against the gift catalog by hand. Capturing the intent server-side keeps the admin workflow exactly as easy as it is today (look at a list, click confirm).

### 2. The amount-entry UX lives in the claim modal, not on a separate page

The modal's `mercadopago` branch renders, in order: gift name, **valor a pagar: R$ XXX,XX** in a large font with a `Copiar valor` button, a brief 3-step instruction list ("1. Copie o valor", "2. Abra o Mercado Pago", "3. Cole o valor e pague"), and a primary CTA `Abrir Mercado Pago` (target `_blank`, `rel="noopener noreferrer"`). The buyer-info form stays where it is today (above or below — chosen during implementation).

**Alternative considered**: a separate `/presentes/[id]/pagar` route. Rejected — it adds a navigation step and a route to maintain for a flow that's already two clicks (modal → MP).

### 3. Manual confirmation lives at `/admin/pending-payments` and reuses the old webhook's branching

The new `confirmPendingPayment(pendingId)` server action mirrors the old webhook logic:
- Load the pending row + gift.
- If gift is `singlePurchase: true`: `findOneAndUpdate({ _id, status: { $ne: "purchased" } }, { status: "purchased", paymentId: null, ... })`. Mirror buyer fields on the gift document (legacy behavior in `gift-buyer-tracking`).
- Else: append to `purchases[]` with `source: "mercadopago-open-link"`, `paymentId: null`, `purchasedAt: now`. Idempotent guard not needed (admin only confirms once per row).
- Mark the pending row `status: "confirmed"` with `confirmedAt`.

`cancelPendingPayment(pendingId)` releases any reservation, marks the row `cancelled`. No data deleted.

**Why retain `paymentId` as `null`** (rather than capturing the MP transaction id during confirmation): admins do not consistently copy the MP txn id, and the historical UI already handles `paymentId: null` for `source: "claim"` rows. Optional `mpReferenceNote` text field on the row gets used for free-form notes if admin wants.

### 4. Single-purchase reservation is moved to pending-payment creation

Today: reservation happens when `/api/gifts/[id]/checkout` is hit; release happens via TTL (`releaseExpiredReservations`) or webhook confirmation.

New: reservation happens at the same point (pending-payment creation), released by `cancelPendingPayment`, by `confirmPendingPayment`, or by the existing TTL sweep. No new TTL machinery.

**Failure mode**: a buyer reserves, never pays, never returns. Admin sees the pending row, no MP transaction, clicks `Cancelar`. Or the TTL expires the reservation independently. Either way, the gift becomes available again.

### 5. Shared payment link URL stored in `settings`, not env

`settings.findOne({ key: "mercadopago_payment_link" })` → `{ url }`. Editable from `/admin/settings`. Seed on first deploy or via the settings page itself.

**Why not env**: the couple may rotate slugs (or use a different MP account). An admin should be able to change it without a deploy. The URL is not a secret — it's a public link.

### 6. `pix-fallback-mode` and `panic-mode-tri-state` are retired, not adapted

`pix-fallback-mode` exists to provide a PIX QR code when MP preference creation fails. With no MP API call, there is no failure to detect — the open link redirect either works (browser opens MP) or it doesn't (the user notices). Adapting the panic-mode signal to a different trigger (e.g. "manual admin disable of MP mode") would just be a feature flag without a real automatic signal behind it.

**Recommendation in the change**: archive the `panic-mode-tri-state` change without implementing.

**Alternative considered**: keep `panic-mode-tri-state` as an "MP open-link off" manual switch (when active, the claim modal does not render the MP CTA). Rejected — premature; if the link ever breaks, admin can change the URL in settings or temporarily set gift `purchaseMode` to `pix`.

### 7. Removed code: `external-reference.ts`, `mp-errors.ts`, `mercadopago.ts`, `panic-mode.ts`, webhook route, panic-mode UI components

Verify before deleting `external-reference.ts` that no other module imports `encodeBuyerRef`/`decodeBuyerRef`/`BuyerInfo`. The `BuyerInfo` type may be re-exported from `ClaimModal.tsx` — confirm during implementation. If `BuyerInfo` is reused, move it into `src/data/types.ts`.

## Risks / Trade-offs

- **[Buyer claims gift but never pays]** → A pending row sits in admin until cancelled. Mitigated by: TTL sweep for single-purchase reservations (already exists); admin cancel button; pending rows are cheap.
- **[Buyer pays the wrong amount]** → The MP dashboard shows the wrong value, admin must judge whether to confirm anyway or contact the buyer. Mitigated by: prominent `Valor a pagar: R$ XXX,XX` + Copiar valor button + 3-step instructions in the modal. Not eliminated.
- **[Admin forgets to reconcile]** → Gifts appear "still available" on the public list even though paid; risk of double-gifting on `singlePurchase` items. Mitigated by: single-purchase items move to `reserved` at intent time, so the public list shows them as taken from the moment the buyer claims (not waiting on admin). Multi-purchase items are unaffected (they accept any number of buyers).
- **[Admin marks confirmed without a real payment]** → Gift looks purchased, money never arrived. Inherent to the trust model. Mitigated only by admin discipline (cross-check the MP dashboard before clicking Confirmar). Not eliminated.
- **[Payment link slug rotates or breaks]** → All buyers hit a dead MP page. Mitigated by: URL stored in `settings`, editable in `/admin/settings` without a deploy. Admin updates and the next click works.
- **[Conflict with in-flight `panic-mode-tri-state` change]** → Two changes target overlapping files (`src/lib/panic-mode.ts`, admin settings page, `PanicModeModeSelector.tsx`, the `pix-fallback-mode` spec). If both archive, the second will fail. Mitigated by: explicit recommendation in the proposal to archive `panic-mode-tri-state` without implementing before applying this change.

## Migration Plan

This is a wedding site with low write volume; downtime tolerance is high but a clean cutover is preferred.

**Deploy sequence:**
1. Apply this change (code + spec deltas).
2. Before deploy: seed the `settings` collection with `{ key: "mercadopago_payment_link", value: { url: "https://link.mercadopago.com.br/presentecarolejoao" } }`. The admin settings page also works for this if seeded later.
3. Deploy. Any in-flight `Preference` URLs already issued in the browser continue to work because they are MP-hosted and don't depend on our backend; the webhook is gone so they won't auto-mark gifts purchased — admin reconciles manually for any payment landing in that window.
4. Remove `MERCADOPAGO_ACCESS_TOKEN` from deployment env / secret store. Remove `mercadopago` from `package.json` dependencies and rerun lockfile install.
5. Leave `mp_errors` and `settings.panic_mode` documents in place. No destructive cleanup.

**Rollback strategy:**
- Revert the commit. `MERCADOPAGO_ACCESS_TOKEN` must be re-added to env. `pending_payments` rows created during the new flow remain in the database (read-only after rollback); admin can manually port them to the old single-purchase confirmation if needed.

## Open Questions

- **PR/Q1**: Should the `Purchase.source` value be `"mercadopago-open-link"` (proposed) or just kept as `"mercadopago"` so existing admin filters continue to match without modification? Lean towards keeping `"mercadopago"` to minimize admin UI churn — re-confirm during implementation when the admin filters are touched.
- **PR/Q2**: Should `cancelPendingPayment` allow the admin to add a free-form note (kept for audit)? Out of scope for v1; revisit if needed.
- **PR/Q3**: When the gift's price changes after a pending row is created but before confirmation, which amount wins on the confirmation record — the snapshot in the pending row or the current gift price? Snapshot in the pending row (proposed): represents what was communicated to the buyer.
