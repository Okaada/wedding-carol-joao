## Why

Mercado Pago outages or integration errors could block guests from buying gifts entirely. On a high-traffic day (the wedding itself), even temporary failures are unacceptable. The couple needs a safety net: if Mercado Pago fails, guests should automatically get a PIX QR code with the gift amount so they can still pay — using the PIX credentials already configured in the admin panel.

## What Changes

- **Panic mode toggle in admin**: A manual switch on the admin settings page to force all Mercado Pago gifts to fall back to PIX checkout instead. The couple can flip this if they know MP is down.
- **Automatic panic mode**: The checkout endpoint logs MP errors to a new `mp_errors` MongoDB collection. If 3+ errors are recorded in the current day, panic mode activates automatically — no admin action needed.
- **PIX fallback in checkout flow**: When panic mode is active (manual or auto), the "Presentear" button for `mercadopago` gifts behaves like external gifts: opens the claim modal with a PIX QR code instead of redirecting to Mercado Pago.
- **Admin visibility**: The admin settings page shows current panic mode status (off / manual / auto-triggered) and the error count for the day.

## Capabilities

### New Capabilities
- `pix-fallback-mode`: Panic mode toggle, automatic error threshold detection, and PIX fallback behavior for Mercado Pago gifts.

### Modified Capabilities
<!-- No existing spec-level capabilities are being modified -->

## Impact

- **Database**: New `mp_errors` collection to log checkout failures with timestamps. New `panic_mode` document in the `settings` collection.
- **API**: Checkout endpoint logs errors and checks panic mode. New API route or server action to toggle panic mode.
- **Components**: `GiftCard` needs to know if panic mode is active to switch behavior. Admin settings page gets a new panic mode section.
- **`src/app/presentes/page.tsx`**: Must check panic mode status and generate PIX data for all gifts (not just external) when active.
