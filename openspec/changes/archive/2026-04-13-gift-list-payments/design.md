## Context

The wedding site for Carol & João already has a working gift list at `/presentes` with:
- Gift CRUD in the admin panel (`/admin/gifts`)
- A public gift catalog rendering `GiftCard` components
- A PIX QR code payment section (manual, no automated confirmation)
- A simple claim endpoint (`POST /api/gifts/[id]/claim`) that sets status to "reserved" with a guest name

The current flow has no automated payment verification. Mercado Pago integration will add a real checkout with automated confirmation via webhooks.

**Existing stack**: Next.js 16 (App Router), MongoDB Atlas (direct driver, no ORM), NextAuth 5, deployed on Vercel.

## Goals / Non-Goals

**Goals:**
- Automated payment confirmation — no manual verification needed
- Prevent double purchases with atomic reservation + webhook confirmation
- Keep the existing PIX option as a fallback (some guests prefer it)
- Clean integration with the existing gift model and admin panel

**Non-Goals:**
- Shopping cart / multi-gift checkout (one gift per transaction)
- Partial payments or installments configuration
- Refund handling (manual via Mercado Pago dashboard)
- Inventory management beyond purchased/available status
- Guest accounts or order history

## Decisions

### 1. Use Mercado Pago Checkout Pro (Preferences API)

**Choice**: Create a payment preference via the Mercado Pago SDK, then redirect the guest to the hosted checkout page.

**Why**: Checkout Pro handles the full payment UI, PCI compliance, and multiple payment methods (credit card, debit, Pix via MP, boleto). No need to build a custom payment form. The SDK handles preference creation in ~10 lines.

**Alternative considered**: Checkout Bricks (embedded UI). Rejected because it adds frontend complexity and requires handling tokenization. Redirect-based checkout is simpler and sufficient for a single-item gift purchase.

### 2. Reserve gift atomically before creating preference

**Choice**: Use MongoDB `findOneAndUpdate` with `status: "available"` filter to atomically reserve the gift before calling Mercado Pago. Set `status: "reserved"` with a `reservedAt` timestamp. If the payment isn't completed within 30 minutes, a cleanup mechanism releases the reservation.

**Why**: Prevents two guests from paying for the same gift. The atomic update ensures only one reservation succeeds. The timeout prevents permanently locked gifts from abandoned checkouts.

**Alternative considered**: Optimistic approach (create preference first, check on webhook). Rejected because two guests could both pay for the same gift, requiring refunds.

### 3. Webhook endpoint for IPN (Instant Payment Notification)

**Choice**: `POST /api/webhooks/mercadopago` receives Mercado Pago notifications. On receiving a `payment` topic notification, fetch the payment details from the MP API, verify status is `approved`, extract the gift ID from `external_reference`, and update the gift to `purchased`.

**Why**: Server-side webhook is the only reliable way to confirm payment. Frontend return URLs cannot be trusted.

### 4. Use `external_reference` to link payment to gift

**Choice**: Pass the gift's MongoDB `_id` as `external_reference` in the preference. The webhook reads it back to identify which gift was paid for.

**Why**: Simple, built-in Mercado Pago feature. No need for a separate payments collection or lookup table. The gift ID is enough to complete the flow.

### 5. Keep PIX QR section alongside Mercado Pago

**Choice**: Keep the existing `PixSection` component on the gifts page as an alternative payment option. Mercado Pago becomes the primary flow per gift, PIX stays as a general contribution option.

**Why**: Some guests may prefer direct PIX transfer. The PIX section is already built and works. No reason to remove it.

### 6. Reservation expiry via API check (no cron)

**Choice**: When loading the gifts page or when the checkout endpoint is called, check for expired reservations (reservedAt > 30 min ago) and release them back to "available". No background cron job needed.

**Why**: Vercel serverless doesn't support persistent cron jobs easily. Checking on page load is simple and sufficient for the expected traffic volume. A Vercel cron could be added later if needed.

## Risks / Trade-offs

- **[Webhook delivery failure]** → Mercado Pago retries webhooks automatically. If all retries fail, the gift stays "reserved" and expires after 30 minutes. Admin can manually check MP dashboard. Acceptable for a wedding site.

- **[Race condition on reservation expiry]** → Two requests could both try to release an expired reservation and re-reserve. Mitigated by atomic `findOneAndUpdate` — only one succeeds.

- **[Mercado Pago sandbox vs production]** → Development/testing uses sandbox credentials. Must switch to production access token before go-live. Environment variable swap only.

- **[Webhook URL must be publicly accessible]** → Vercel deployments are public by default. For local development, use `ngrok` or Mercado Pago's test tools.

- **[No refund automation]** → If a payment is approved but the couple wants to refund, it must be done manually through the Mercado Pago dashboard. Acceptable scope for a wedding site.
