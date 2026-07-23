## REMOVED Requirements

### Requirement: Manual panic mode toggle
**Reason**: The MP API integration is removed. There is no API call to fall back from; the toggle has no behavior to gate.
**Migration**: Delete `src/components/admin/PanicModeToggle.tsx` and `src/components/admin/PanicModeModeSelector.tsx`. The `settings.panic_mode` document is left in place (ignored). Operators who want to disable the MP open-link CTA per-gift can change the gift's `purchaseMode` to `"pix"`.

### Requirement: Mercado Pago errors are logged to database
**Reason**: With no Mercado Pago API call, there are no preference-creation failures to log.
**Migration**: Delete `src/lib/mp-errors.ts` and stop writing to the `mp_errors` collection. The collection itself is left in place (ignored) and may be dropped manually after deploy.

### Requirement: Automatic panic mode activation on 3+ errors per day
**Reason**: There are no MP errors to count.
**Migration**: Delete `src/lib/panic-mode.ts` and the auto-trigger logic. The `isPanicModeActive()` helper is removed; callers in `/presentes/page.tsx` and `ClaimModal.tsx` are updated to drop the fallback branch (Mercado Pago gifts always route to the open-link flow).

### Requirement: PIX fallback for mercadopago gifts in panic mode
**Reason**: `mercadopago` gifts no longer have a "primary mode" that can fail and fall back. They always render the open-link CTA in the claim modal.
**Migration**: Remove the `panicMode` and `pixQrCodeUrl`/`pixPayload` props from the `mercadopago` branch of `GiftCard`/`ClaimModal`. Gifts with `purchaseMode: "pix"` continue to render PIX QR codes via their own flow (untouched by this change).

### Requirement: Admin visibility of panic mode status and error count
**Reason**: There is no panic mode to display.
**Migration**: Remove the panic-mode status block from `/admin/settings`. The page gains a single input for `mercadopago_payment_link` (defined in the new `mp-open-link-checkout` capability).

### Requirement: PIX data generated for all gifts in panic mode
**Reason**: PIX QR codes are only generated for `purchaseMode: "pix"` gifts now, via the existing PIX flow. No bulk generation tied to a panic-mode flag.
**Migration**: Remove the `panicMode`-gated PIX data generation from `/presentes/page.tsx`. PIX data for `pix` gifts continues to be generated through the unchanged PIX code path.
