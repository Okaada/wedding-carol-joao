## 1. Data model

- [x] 1.1 In `src/data/types.ts`, add a `Purchase` interface (`source: "claim" | "mercadopago"`, `buyerType: "individual" | "couple" | "group"`, `buyerName: string`, `buyerNames: string[]`, `paymentId: string | null`, `purchasedAt: string`) and extend `Gift` with `singlePurchase: boolean` and `purchases: Purchase[]`
- [x] 1.2 Add a small helper `src/lib/external-reference.ts` exporting `encodeBuyerRef(giftId, buyerInfo): string` (returns `"<giftId>|<base64url(JSON({buyerType, buyerName, buyerNames}))>"`, trimming `buyerNames` so the total stays ≤ 200 chars) and `decodeBuyerRef(ref): { giftId, buyerInfo | null }` (handles both the new `|`-separated form and legacy bare-giftId)

## 2. Admin form (toggle)

- [x] 2.1 In `src/components/admin/GiftForm.tsx`, add a "Compra única?" checkbox (`name="singlePurchase"`) with `defaultChecked={defaultValues.singlePurchase}`; extend the `defaultValues` Props type with `singlePurchase?: boolean`
- [x] 2.2 In `src/app/actions/admin-gifts.ts`, parse `singlePurchase` from the form (`formData.get("singlePurchase") === "on"`); on `createGift`, persist `singlePurchase` plus `purchases: []`; on `updateGift`, persist `singlePurchase`
- [x] 2.3 In `src/app/admin/gifts/[id]/edit/page.tsx`, pass `singlePurchase` through to `GiftForm`'s `defaultValues`

## 3. Backend flows (claim, checkout, webhook)

- [x] 3.1 In `src/app/api/gifts/[id]/claim/route.ts`, after validating buyer info, look up the gift; if `gift.singlePurchase === true`, keep the current `findOneAndUpdate({ _id, status: "available" }, { $set: { status: "claimed", ... } })` AND `$push` a `Purchase` entry to `purchases[]`; if `gift.singlePurchase === false`, do an unconditional `updateOne({ _id }, { $push: { purchases: <entry> }, $set: { updatedAt: ... } })` with no status change
- [x] 3.2 In `src/app/api/gifts/[id]/checkout/route.ts`, look up the gift; if `singlePurchase === true`, keep the current reserve-then-rollback-on-failure flow; if `singlePurchase === false`, skip the reservation entirely, build the MP preference with `external_reference: encodeBuyerRef(id, buyerInfo)`, and return the preference URL without writing anything to the gift document
- [x] 3.3 In `src/app/api/webhooks/mercadopago/route.ts`, call `decodeBuyerRef(payment.external_reference)`; look up the gift by the decoded `giftId`; if `singlePurchase === true` or the ref has no buyer info (legacy), keep the current `findOneAndUpdate({ _id, status: { $ne: "purchased" } }, { $set: { status: "purchased", paymentId, ... } })`; if `singlePurchase === false`, do an idempotent `findOneAndUpdate({ _id, "purchases.paymentId": { $ne: String(paymentId) } }, { $push: { purchases: <entry with paymentId, source: "mercadopago"> }, $set: { updatedAt: ... } })`

## 4. Guest UI (`/presentes`)

- [x] 4.1 In `src/components/GiftCard.tsx`, replace `const isAvailable = status === "available"` with `const isAvailable = gift.singlePurchase === false || status === "available"`; on a successful multi-purchase claim, do NOT call `setStatus("claimed")` (keep status as `"available"` so the card stays open); show a small confirmation toast/text but keep the "Presentear" button visible
- [x] 4.2 In `src/app/presentes/page.tsx` `buildMongoFilter`, when `params.available === "available"` use the OR predicate `{ $or: [ { singlePurchase: { $ne: true } }, { status: "available" } ] }` (and drop the unconditional `status: "available"` set on the filter); leave `{ status: { $ne: "purchased" } }` as the base for the `"all"` view

## 5. Admin views

- [x] 5.1 In `src/components/admin/GiftTable.tsx`, branch the "Comprador" cell: if `gift.singlePurchase === true` (or legacy doc with `buyerName` and no `purchases`), keep the current rendering; if multi-purchase, show `${gift.purchases.length} comprador(es)` plus a preview of the first two names with `+N outros` when `purchases.length > 2`; show "—" when `purchases.length === 0`
- [x] 5.2 In `src/app/admin/gifts/page.tsx`, replace the `purchased` count with `gifts.filter(g => g.status === "purchased").length + gifts.reduce((acc, g) => acc + (g.purchases?.length ?? 0), 0)`
- [x] 5.3 In `src/app/admin/gifts/[id]/edit/page.tsx` (and any helper component it uses), when the loaded gift is multi-purchase with entries in `purchases[]`, render a read-only list of the entries below the form (buyer name(s), type label, source, formatted `purchasedAt`)

## 6. Migration

- [x] 6.1 Create `scripts/migrate-gifts-multi-purchase.ts` modeled on `scripts/seed-admin.ts`: connect via `getMongoClient`, run `updateMany({ singlePurchase: { $exists: false } }, { $set: { singlePurchase: false } })`, `updateMany({ purchases: { $exists: false } }, { $set: { purchases: [] } })`, and `updateMany({ status: { $in: ["reserved", "claimed"] } }, { $set: { status: "available", reservedAt: null, claimedBy: null, claimedAt: null, updatedAt: new Date().toISOString() } })`; log the modified counts
- [x] 6.2 Add a `migrate:gifts-multi-purchase` script to `package.json` invoking the migration via `node --import tsx` (matching the existing seed-admin pattern)

## 7. Verify

- [ ] 7.1 `npm run lint` and `npm run build` pass
- [ ] 7.2 Run the migration against a local Mongo seeded with a mix of `available` / `reserved` / `claimed` / `purchased` gifts; confirm `reserved` and `claimed` are reset to `available`, `purchased` is untouched, and `singlePurchase`/`purchases` are backfilled
- [ ] 7.3 In `/admin/gifts/new`, create a gift WITHOUT checking "Compra única?"; verify the persisted document has `singlePurchase: false` and `purchases: []`
- [ ] 7.4 Claim the multi-purchase gift twice (via the public claim modal); verify two entries land in `purchases[]`, the gift stays `status: "available"`, and the "Presentear" button is still visible on the card after each claim
- [ ] 7.5 Reserve a single-purchase gift via the legacy MP flow (admin creates one with "Compra única?" checked); verify `status: "reserved"` appears and the card locks (legacy behavior unchanged)
- [ ] 7.6 Trigger an MP webhook with a duplicate `paymentId` for a multi-purchase gift; verify only one entry is added to `purchases[]`
- [ ] 7.7 Open `/admin/gifts`; verify the "Comprados" stat reflects both legacy `purchased` gifts and `purchases[]` entries; verify the "Comprador" column shows the multi-buyer summary on multi-purchase gifts
