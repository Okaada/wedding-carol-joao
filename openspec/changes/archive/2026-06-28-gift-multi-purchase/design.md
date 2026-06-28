## Context

Gifts today flow through a strict single-purchase state machine: `available` → `reserved` (during Mercado Pago checkout, with a 30-minute auto-release in `releaseExpiredReservations`) → `purchased` (set by the MP webhook on approval); the external/PIX flow uses `available` → `claimed`. The `GiftCard` UI hides the "Presentear" button for any non-`available` status and the admin table treats buyer info as a single tuple (`buyerName`, `buyerType`, `buyerNames`).

Carol wants most gifts to stay open so several guests can contribute toward the same item, while keeping the lock-on-first-purchase behavior available for items that genuinely should sell only once. The smallest viable model is a per-gift boolean (`singlePurchase`, default `false`) plus an embedded list of purchases on the gift document so the admin can see every contribution.

## Goals / Non-Goals

**Goals:**
- Add a per-gift toggle that opts a gift into the legacy lock-on-first-purchase behavior.
- For the default (multi-purchase) gifts: never lock the card, accept many claims, accept many MP payments — recording each one with full buyer info.
- Migrate existing data so the bride's preference (no locking) is applied retroactively, without losing any historic buyer info.
- Keep the admin view useful: surface how many people bought each gift and who they were.
- Preserve idempotency on the MP webhook so a retried notification never double-counts a payment.

**Non-Goals:**
- Per-purchase quantity (the buyer always contributes for "one unit"; multi-buy aggregation is just multiple list entries).
- Splitting payments / pro-rata pricing.
- Refund/cancel flows for individual entries in `purchases[]`.
- A separate `gift_purchases` collection. Embedded array is enough for the wedding's scale.
- Real-time updates on the card after another guest buys (the page is server-rendered; a refresh is acceptable).
- Per-purchase notification emails or admin alerts.

## Decisions

### 1. Boolean field on the gift, default `false`
**Decision:** Add `singlePurchase: boolean` directly on the gift document. New gifts default to `false`. Migration sets `false` on every existing gift.

**Rationale:** The user explicitly asked for "Compra única?" as a single yes/no on the admin form, defaulting to "no". A boolean is the simplest shape that captures the intent; no enum or capacity counter is needed today.

**Alternative considered:** `maxPurchases: number | null` (null = unlimited). Rejected — the requirement is purely binary right now, and a counter invites questions ("what does 3 mean? per buyer or per total?") that aren't worth answering pre-emptively.

### 2. Embed purchases as `purchases: Purchase[]` on the gift document
**Decision:** Each successful claim or approved MP payment appends one entry to the gift document's `purchases` array:

```ts
type Purchase = {
  source: "claim" | "mercadopago";
  buyerType: "individual" | "couple" | "group";
  buyerName: string;
  buyerNames: string[];
  paymentId: string | null; // present only for MP
  purchasedAt: string;       // ISO timestamp
};
```

**Rationale:** Embedding fits the existing one-doc-per-gift shape; reads stay a single query; the wedding will plausibly see at most a few dozen purchases per gift; MongoDB's 16 MB doc limit is irrelevant at that scale. Keeps related state co-located, so the admin table can render the list without a join.

**Alternative considered:** Separate `gift_purchases` collection with `giftId`. Rejected — adds a second collection, an aggregation join in `/admin/gifts`, and migration complexity, for no immediate benefit.

### 3. Branch behavior at the API layer, not in shared helpers
**Decision:** The claim route, checkout route, and MP webhook each branch on `gift.singlePurchase` and pick one of two write strategies (legacy lock vs. append-to-purchases). `releaseExpiredReservations` is untouched — it can keep sweeping the (now rarer) single-purchase reservations.

**Rationale:** The legacy single-purchase path is already battle-tested; rewriting it into a shared abstraction would risk regressions for items where the lock matters most (the few truly unique gifts). Keeping two clearly-labeled branches per route is easier to read than a parameterized helper.

### 4. Multi-purchase MP gifts skip the `reserved` step entirely
**Decision:** When `singlePurchase === false`, the checkout route creates the MP preference without touching the gift document. The buyer info from the modal is encoded into the MP preference's `external_reference` (or `metadata`) so the webhook can recover it.

**Rationale:** Reserving a gift that allows concurrent purchases is meaningless and would only create race conditions ("which buyer wins the lock?"). With no reservation, the rollback-on-MP-failure step also vanishes — the gift document was never mutated. The webhook is the single writer of confirmed purchases.

**Trade-off:** The webhook now needs to carry buyer info from the click-time modal all the way to the approval notification. Encoded into `external_reference: "<giftId>:<base64(buyer)>"` keeps the change additive (legacy `external_reference: "<giftId>"` parses cleanly under the new parser).

### 5. Webhook idempotency via `paymentId` deduplication
**Decision:** Before appending to `purchases[]`, the webhook checks whether any existing entry already has `paymentId === <incoming>`. If so, skip. Use a single atomic `findOneAndUpdate` with `{ "purchases.paymentId": { $ne: paymentId } }` to combine the check and the push.

**Rationale:** Mercado Pago retries webhooks; we must never double-count. The legacy single-purchase webhook achieves the same via `{ status: { $ne: "purchased" } }`. The new check is a direct analogue.

### 6. Public `/presentes` availability rules
**Decision:** Update `buildMongoFilter` so the default `available` filter matches `{ $or: [ { singlePurchase: { $ne: true } }, { status: "available" } ] }` and excludes only single-purchase gifts that are not `available`. The "Todos" toggle excludes nothing extra for multi-purchase gifts (they're never `purchased` at the gift-document level).

**Rationale:** A multi-purchase gift is conceptually always "available", even if 12 people already chipped in. The locked-card UI in `GiftCard` likewise gates on `singlePurchase` so it only shows for the legacy flow.

### 7. Admin stats: count purchase entries, not just `purchased` status
**Decision:** "Comprados" stat = `count(gifts where status === "purchased") + sum(gifts.purchases.length)` computed in a single aggregation. Display unchanged.

**Rationale:** Treating each entry in `purchases[]` as one "Comprado" keeps the dashboard meaningful as gifts accumulate multiple contributions. Without this, the count would freeze at 0 for the (now dominant) multi-purchase gifts.

### 8. One-shot migration script + idempotent shape
**Decision:** Ship `scripts/migrate-gifts-multi-purchase.ts` that:
1. Sets `singlePurchase: false` on every gift that doesn't have the field.
2. Initializes `purchases: []` where missing.
3. Resets any `status` in (`reserved`, `claimed`) to `available`, clearing `reservedAt`, `claimedBy`, `claimedAt`. (Status `"purchased"` is preserved — it represents a real completed sale on what used to be a single-purchase item.)

The script is idempotent and safe to re-run. Document running it once after deploy.

**Rationale:** The user explicitly asked that the new default apply to existing gifts. Resetting `reserved`/`claimed` matches the "no locking" intent retroactively, while preserving `purchased` avoids erasing the historical record of a completed sale.

### 9. Carry per-purchase buyer info through MP's `external_reference`
**Decision:** For multi-purchase MP checkouts, set `external_reference = "<giftId>|<base64url(JSON.stringify({buyerType, buyerName, buyerNames}))>"`. The webhook parses on `|` once; if there is no `|`, it falls back to the legacy single-purchase path (treating the whole string as a giftId).

**Rationale:** The MP preference has no first-class buyer field. `external_reference` is the only field guaranteed to come back on the webhook. Base64URL keeps it URL-safe and small. The fallback parse keeps every existing legacy reservation working unchanged after deploy.

**Trade-off:** `external_reference` has a 256-char MP limit. JSON-encoded buyer info plus `<giftId>|` is well under that for normal names; we'll truncate `buyerNames` defensively in code (cap total payload at 200 chars, keep first ~6 names).

## Risks / Trade-offs

- **[MP webhook arrives before frontend POST returns]** → Mitigation: the webhook is the only authoritative writer for multi-purchase gifts; the frontend doesn't need to write anything for MP flow. For the claim flow, the route writes synchronously before returning success — no race.
- **[Two concurrent MP webhooks for the same payment]** → Mitigation: atomic `findOneAndUpdate` with `paymentId`-not-in-array guard (decision 5).
- **[Migration is re-run accidentally]** → Mitigation: idempotent shape (decision 8); `$set` is a no-op when the value already matches, and the `status` reset only touches `reserved`/`claimed`. Document that re-running is safe.
- **[Bride flips a gift back to single-purchase after it already accumulated multiple purchases]** → Accepted as a manual admin action. The existing `purchases[]` array is preserved; the gift simply stops accepting new purchases when the first one tips it into `claimed`/`reserved`/`purchased` again. The admin form should warn about this case (deferred to a follow-up if it becomes a real problem).
- **[`external_reference` length cap]** → Mitigation: 200-char defensive cap + first-N names (decision 9).
- **[Admin stats query gets slower]** → Accepted at wedding scale (hundreds of gifts × a few purchases each).

## Migration Plan

1. Deploy code changes — they tolerate documents missing `singlePurchase` / `purchases` (treated as `false` / `[]` at read time, defensively).
2. Run `node --import tsx scripts/migrate-gifts-multi-purchase.ts` once against production Mongo to backfill the new fields and reset any locked gifts.
3. Verify by visiting `/presentes` — previously locked gifts now show "Presentear" again.
4. **Rollback:** revert the deploy. The two new fields stay on the documents (harmless to the old code path which ignores them). Any gifts that were reset from `reserved`/`claimed` to `available` will be visibly available to guests under the old code too — that's a desirable side effect, not a rollback hazard.

## Open Questions

- Should the admin gift edit page expose a button to convert a multi-purchase gift back to single-purchase atomically (and explicitly archive the existing `purchases[]`)? Deferred — flipping the checkbox + saving is enough for now.
- Should the "Comprador" admin column become a separate "Compradores" subpage when `purchases.length > 5`? Deferred until the row becomes visually crowded in practice.
