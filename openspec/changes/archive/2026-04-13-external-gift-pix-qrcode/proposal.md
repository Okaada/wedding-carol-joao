## Why

When a gift is set to "compra externa", there's no built-in payment method — the guest must buy externally and claim. The couple wants to offer PIX as a payment option for these external gifts, using the same PIX credentials already configured in the admin panel. This lets guests pay the couple directly via PIX for any gift, without needing Mercado Pago.

## What Changes

- **PIX QR code on external gifts**: When a guest clicks "Presentear" on an external gift, the claim modal displays a PIX QR code generated from the gift's price and the admin-configured PIX settings.
- **Per-gift PIX payload with amount**: The existing PIX payload generator is extended to support an optional transaction amount, so the QR code encodes the exact gift price.
- **Copy PIX code in modal**: The modal includes a "Copiar código PIX" button alongside the QR code, matching the existing PixSection UX pattern.

## Capabilities

### New Capabilities
- `gift-pix-checkout`: PIX QR code generation and display within the claim modal for external gifts, including amount-specific PIX payload.

### Modified Capabilities
<!-- No existing spec-level capabilities are being modified -->

## Impact

- **`src/lib/pix.ts`**: `generatePixPayload` gains an optional `amount` parameter to embed transaction value in the PIX payload.
- **`src/components/ClaimModal.tsx`**: Displays PIX QR code and copy button for external gifts.
- **`src/app/presentes/page.tsx`**: Must pass PIX settings to gift cards so the modal can generate QR codes client-side (or generate server-side and pass as props).
- **API**: New endpoint or server action to generate a PIX QR code data URL for a given amount (since `qrcode` library runs server-side).
