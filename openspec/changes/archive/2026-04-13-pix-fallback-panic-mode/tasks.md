## 1. Error Logging Infrastructure

- [x] 1.1 Create `src/lib/mp-errors.ts` with `logMpError(giftId: string, error: string)` function that inserts into `mp_errors` collection, and `getTodayMpErrorCount()` that counts today's errors (UTC)
- [x] 1.2 Update `POST /api/gifts/[id]/checkout` to call `logMpError` on Mercado Pago preference creation failure (before rollback response)

## 2. Panic Mode Settings

- [x] 2.1 Create `src/lib/panic-mode.ts` with `isPanicModeActive()` (checks manual toggle OR 3+ errors today) and `getPanicModeStatus()` (returns full status for admin display)
- [x] 2.2 Add `togglePanicMode` server action in `src/app/actions/admin-settings.ts` that upserts the `panic_mode` document in settings collection

## 3. Admin Settings UI

- [x] 3.1 Add panic mode section to admin settings page (`src/app/admin/settings/page.tsx`) showing toggle button, today's error count, and current status text
- [x] 3.2 Create `PanicModeToggle` client component for the toggle button with optimistic UI

## 4. Presentes Page — Panic Mode Awareness

- [x] 4.1 Update `src/app/presentes/page.tsx` to check `isPanicModeActive()` and generate PIX data for ALL priced gifts (not just external) when active
- [x] 4.2 Pass `panicMode` boolean prop to each `GiftCard`

## 5. GiftCard Panic Mode Behavior

- [x] 5.1 Update `GiftCard` to accept `panicMode` prop — when true and gift is `mercadopago`, open claim modal with PIX QR code instead of checkout redirect
- [x] 5.2 Update `ClaimModal` to show PIX section for mercadopago gifts when in panic mode (achieved by passing mode="external" from GiftCard)

## 6. Verification

- [x] 6.1 Build the project and verify no TypeScript errors
- [x] 6.2 Test that the admin toggle works and status displays correctly
