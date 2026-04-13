## Why

The wedding site already has a gift list (`/presentes`) with PIX QR code payments and a simple "claim" reservation system. However, PIX requires manual confirmation — there's no automated way to verify payment. Adding Mercado Pago integration enables automated payment processing: guests pay online, the webhook confirms the payment, and the gift is automatically marked as purchased. This removes manual verification and prevents double-purchase scenarios.

## What Changes

- Add a Mercado Pago checkout flow: when a guest clicks to gift an item, the backend creates a payment preference and redirects them to Mercado Pago
- Add a webhook endpoint to receive Mercado Pago payment notifications and automatically mark gifts as `purchased`
- Add reservation logic with timeout to prevent double purchases during the payment window
- Update the existing gift claim flow to go through Mercado Pago instead of simple reservation
- Add Mercado Pago configuration to admin settings (access token)

## Capabilities

### New Capabilities
- `gift-checkout`: Mercado Pago payment flow — creating preferences, redirecting to payment, handling return URLs and payment confirmation
- `gift-webhook`: Webhook processing — receiving Mercado Pago IPN notifications, validating payment status, updating gift status automatically

### Modified Capabilities
<!-- No existing spec capabilities are affected — the gift CRUD and catalog display remain unchanged -->

## Impact

- **New API routes**: `POST /api/gifts/[id]/checkout` (create preference), `POST /api/webhooks/mercadopago` (receive IPN)
- **Modified API route**: `POST /api/gifts/[id]/claim` — may be replaced or adapted for the new flow
- **New dependency**: `mercadopago` SDK package
- **Environment variables**: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- **Database**: New fields on gifts collection (`reservedAt`, `paymentId`), possible `payments` collection for audit trail
- **Frontend**: Update `GiftCard` component to trigger checkout flow instead of simple claim
- **Admin**: Add Mercado Pago settings to admin panel
