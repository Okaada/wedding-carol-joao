## Why

Today every gift locks the moment the first guest claims or buys it — the card flips to "Presente reservado" / "Presente sendo pago" and the "Presentear" button disappears. Carol prefers that most gifts stay open so more than one guest (or couple, or group) can chip in toward the same item. Keeping a per-gift "Compra única?" switch lets her opt specific items back into the lock-after-first-purchase behavior (e.g., when there really is only one).

## What Changes

- **BREAKING (default behavior)**: New gifts default to multi-purchase. Existing gifts are migrated to multi-purchase too — anything currently `reserved` or `claimed` is reset to `available` so guests can buy/claim again.
- Add a boolean field `singlePurchase` to the `Gift` model (default `false`).
- Add a "Compra única?" checkbox to the admin gift form (create + edit). When checked, the gift keeps today's locking flow; when unchecked, the gift never leaves `available` after a purchase.
- Add a `purchases: Purchase[]` array on the gift document. Every successful claim (external/PIX flow) or approved Mercado Pago payment appends one entry containing buyer info, source (`"claim"` | `"mercadopago"`), `paymentId` when present, and timestamp.
- Adjust the claim, checkout, and webhook flows so they only flip gift status when `singlePurchase === true`. For multi-purchase gifts, they push to `purchases[]` and leave status as `available`.
- Multi-purchase Mercado Pago gifts SKIP the temporary `reserved` lock during checkout — concurrent checkouts are allowed; the webhook is the only writer that records a confirmed payment (idempotent by `paymentId`).
- Admin gift table: replace the single "Comprador" column rendering with a summary that handles N buyers ("Ana, Pedro +3 outros"), plus a purchase count.
- Admin gift stats: rename "Comprados" so it counts confirmed purchase entries (single-purchase status `purchased` + sum of `purchases[]` entries on multi-purchase gifts), keeping the dashboard meaningful as gifts accumulate multiple payments.
- Public guest page (`/presentes`): availability filter and locked-card display treat multi-purchase gifts as always available; only `singlePurchase: true` gifts can ever render in the "Presente reservado/sendo pago" state.

## Capabilities

### New Capabilities
- `gift-multi-purchase`: Per-gift toggle that lets several guests buy or claim the same item; tracks every contribution in a `purchases[]` history.

### Modified Capabilities
- `gift-claim-flow`: Claim and checkout endpoints no longer flip status to `claimed` / `reserved` for multi-purchase gifts; the "Presentear" button stays visible after a purchase on those gifts.
- `gift-buyer-tracking`: Buyer information becomes a list (`purchases[]`) for multi-purchase gifts. Admin table and edit page render this list. Stats include all purchase entries, not just the per-gift `status === "purchased"` flag.
- `gift-list-browsing`: The "Disponíveis" availability filter shows multi-purchase gifts regardless of any past purchase. Locked-card rendering ("Presente reservado" / "Presente sendo pago") applies only to single-purchase gifts.

## Impact

- `src/data/types.ts` — extend `Gift` with `singlePurchase: boolean` and `purchases: Purchase[]`; add `Purchase` interface.
- `src/app/actions/admin-gifts.ts` — `createGift` writes `singlePurchase` (default `false`) and `purchases: []`; `updateGift` accepts the new field.
- `src/components/admin/GiftForm.tsx` — add the "Compra única?" checkbox.
- `src/app/api/gifts/[id]/claim/route.ts` — branch on `singlePurchase`: legacy lock when true, append-to-purchases when false (still validates buyer info).
- `src/app/api/gifts/[id]/checkout/route.ts` — branch on `singlePurchase`: legacy reserve+rollback when true, "create preference without reserving" when false; carry a per-purchase token via `external_reference` so the webhook can record buyer info on the matching entry.
- `src/app/api/webhooks/mercadopago/route.ts` — branch on `singlePurchase`: legacy `status → "purchased"` when true, idempotent push into `purchases[]` (deduped by `paymentId`) when false.
- `src/components/GiftCard.tsx` — keep the "Presentear" button visible for multi-purchase gifts even after a successful claim/purchase; the locked-card UI applies only to single-purchase gifts.
- `src/app/presentes/page.tsx` — `buildMongoFilter` allows multi-purchase gifts under the default `available` filter; locked-card visuals only apply to `singlePurchase: true`.
- `src/components/admin/GiftTable.tsx` — render the `purchases[]` summary (count + buyer-name preview) for multi-purchase gifts; keep the single-buyer rendering for legacy single-purchase gifts.
- `src/app/admin/gifts/page.tsx` — recompute the "Comprados" stat to sum `purchases[]` entries plus legacy `status === "purchased"` count.
- `scripts/migrate-gifts-multi-purchase.ts` — **new** one-shot migration: set `singlePurchase: false` and `purchases: []` on every gift; reset any `reserved` / `claimed` gift back to `available` (clearing `reservedAt`, `claimedBy`, `claimedAt`).
- MongoDB `carol-joao.gifts` collection — schema gains two fields; no breaking shape change for clients that ignore them.
