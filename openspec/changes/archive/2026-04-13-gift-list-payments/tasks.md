## 1. Setup

- [x] 1.1 Install `mercadopago` SDK package
- [x] 1.2 Add environment variables `MERCADOPAGO_ACCESS_TOKEN` to `.env.local` (and document in README or .env.example)
- [x] 1.3 Create Mercado Pago client utility at `src/lib/mercadopago.ts` (initialize SDK with access token)

## 2. Database & Model Updates

- [x] 2.1 Add `reservedAt` and `paymentId` fields to the gift type definition in `src/data/types.ts`
- [x] 2.2 Add reservation expiry cleanup function: query gifts with status "reserved" and `reservedAt` > 30 min, set back to "available"
- [x] 2.3 Call reservation cleanup on gift list page load (`/presentes`) before fetching gifts

## 3. Checkout API Route

- [x] 3.1 Create `POST /api/gifts/[id]/checkout` route: atomically reserve gift, create Mercado Pago preference with `external_reference`, return checkout URL
- [x] 3.2 Configure preference with gift name, price (convert from cents to BRL), quantity 1, and return URLs (success, failure, pending)
- [x] 3.3 Handle error cases: gift not found (404), already reserved/purchased (409), Mercado Pago API error (500)

## 4. Webhook Endpoint

- [x] 4.1 Create `POST /api/webhooks/mercadopago` route to receive IPN notifications
- [x] 4.2 Filter for topic "payment" only, return 200 for other topics
- [x] 4.3 Fetch payment details from Mercado Pago API using `data.id` (server-side validation, don't trust body)
- [x] 4.4 On status "approved": update gift (by `external_reference`) to status "purchased" and store `paymentId`
- [x] 4.5 Handle idempotency: skip update if gift is already "purchased"
- [x] 4.6 Log warning and return 200 if `external_reference` doesn't match any gift

## 5. Frontend Updates

- [x] 5.1 Update `GiftCard` component: replace simple claim button with "Presentear" button that calls the checkout endpoint
- [x] 5.2 Add loading state to the button while the checkout preference is being created
- [x] 5.3 Redirect guest to Mercado Pago `init_point` URL after successful preference creation
- [x] 5.4 Show reserved gifts as unavailable (not clickable) on the gift list
- [x] 5.5 Create a simple success return page or message for guests returning after payment

## 6. Admin Updates

- [x] 6.1 Display payment status and `paymentId` in the admin gift table for purchased gifts
- [x] 6.2 Add Mercado Pago access token configuration to admin settings (or document env-only approach)

## 7. Testing & Validation

- [ ] 7.1 Test full checkout flow with Mercado Pago sandbox credentials (requires MERCADOPAGO_ACCESS_TOKEN)
- [ ] 7.2 Test webhook processing with sandbox payment notifications (requires running server + ngrok)
- [ ] 7.3 Verify reservation expiry releases gifts after 30 minutes
- [ ] 7.4 Verify double-purchase prevention (two guests clicking simultaneously)
- [ ] 7.5 Verify idempotent webhook handling (duplicate notifications)
