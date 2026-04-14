## 1. Data Model Updates

- [x] 1.1 Update `Gift` interface in `src/data/types.ts` — add `purchaseMode`, `buyerType`, `buyerName`, `buyerNames` fields; extend `status` union with `"claimed"`
- [x] 1.2 Update admin `GiftForm.tsx` to include `purchaseMode` dropdown ("Mercado Pago" / "Compra externa") and buyer info fields (read-only display for claimed gifts)
- [x] 1.3 Update `createGift` and `updateGift` server actions in `admin-gifts.ts` to handle new fields

## 2. Claim API Endpoint

- [x] 2.1 Rewrite `POST /api/gifts/[id]/claim` to accept `buyerName`, `buyerType`, `buyerNames` in request body; atomically set status to `"claimed"` with buyer info
- [x] 2.2 Update `POST /api/gifts/[id]/checkout` to accept buyer info in request body and store it alongside reservation

## 3. Claim Modal Component

- [x] 3.1 Create `ClaimModal.tsx` component with buyer name input, buyer type selector (Sozinho/Casal/Grupo), and dynamic additional name fields
- [x] 3.2 Add form validation — primary name required; at least 2 names for couple; at least 2 names for group
- [x] 3.3 Show Mercado Livre link inside modal when available (so guest can open it before confirming)

## 4. GiftCard Flow Update

- [x] 4.1 Update `GiftCard.tsx` — "Presentear" button opens `ClaimModal` for `purchaseMode: "external"` gifts
- [x] 4.2 Update `GiftCard.tsx` — "Presentear" button opens `ClaimModal` first for `purchaseMode: "mercadopago"` gifts, then proceeds to checkout with buyer info
- [x] 4.3 Handle `"claimed"` status in gift card display (show "Presente reservado" state)

## 5. Admin Panel Updates

- [x] 5.1 Add "Comprador" column to `GiftTable.tsx` showing buyer name(s) and type badge (Individual/Casal/Grupo)
- [x] 5.2 Update `GiftStatusBadge.tsx` to support `"claimed"` status with blue badge color
- [x] 5.3 Update admin gifts dashboard stats to include claimed count
- [x] 5.4 Update gift edit page to show/edit buyer info fields

## 6. Edge Cases & Cleanup

- [x] 6.1 Ensure `releaseExpiredReservations` in `src/lib/gifts.ts` does not release `"claimed"` gifts (only `"reserved"`)
- [x] 6.2 Update presentes page query to filter out `"claimed"` gifts alongside `"purchased"` and `"reserved"`
- [x] 6.3 Test full claim flow end-to-end (external gift claim with buyer info)
- [x] 6.4 Test Mercado Pago flow with buyer info modal pre-step
