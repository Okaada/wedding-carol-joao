## 1. Define the public contract

- [x] 1.1 Add a `PublicGift` type in `src/data/types.ts` as `Pick<Gift, "_id" | "name" | "description" | "imageUrl" | "price" | "externalUrl" | "purchaseMode" | "singlePurchase" | "status" | "sortOrder">`
- [x] 1.2 Update `GiftCard` (and `GiftCardProps`) to accept `PublicGift` instead of `Gift`, confirming no buyer field is referenced in the component

## 2. Stop the leak at the data layer

- [x] 2.1 In `src/app/presentes/page.tsx`, add `.project({ purchases: 0, buyerName: 0, buyerNames: 0, claimedBy: 0, paymentId: 0, reservedAt: 0 })` to the public gifts query
- [x] 2.2 Replace the `docs.map((d) => ({ ...d, _id: ... }))` spread with an explicit mapping to `PublicGift` (whitelist fields only)

## 3. Sweep for other public leaks

- [x] 3.1 `git grep -n 'collection.*"gifts"'` and review every reader; confirm only authenticated (`auth()`-guarded) paths receive buyer fields
- [x] 3.2 `git grep -n '{ ...' src/app` on public (non-`/admin`) pages/components and confirm no raw gift/pending document is spread into client props

## 4. Regression guard

- [x] 4.1 Add a test/assertion that builds the public payload for a fixture gift with populated `buyerName`, `buyerNames`, `claimedBy`, and `purchases[]`, then asserts the serialized JSON contains none of: `buyerName`, `buyerNames`, `claimedBy`, `purchases`, `paymentId`

## 5. Verification

- [ ] 5.1 Run the app, open `/presentes`, and inspect the network payload / View Source — confirm no buyer name appears for a gift that has purchases
- [ ] 5.2 `curl -s <url>/presentes | grep -iE 'buyerName|claimedBy|purchases'` returns nothing
- [x] 5.3 `npm run lint` and `npm run build` pass
