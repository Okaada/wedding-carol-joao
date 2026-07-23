## 1. Env vars

- [x] 1.1 Added `MERCADOPAGO_PAYMENT_LINK`, `PIX_KEY_TYPE`, `PIX_KEY_VALUE`, `PIX_RECIPIENT_NAME`, `PIX_CITY` to `.env.example` with comments.
- [ ] 1.2 **Manual, before merge/deploy — do this first**: copy the current values from `/admin/settings` (as shown in the screenshot: MP link `https://link.mercadopago.com.br/presentecarolejoao`, which already matches the code default, plus your current PIX key/name/city) into the deploy platform's env store. Skipping this makes the PIX section disappear from `/presentes` and (harmlessly, since it matches the default) resets the MP link the moment this deploys.

## 2. Settings library

- [x] 2.1 `getMercadopagoPaymentLink()` rewritten to read `process.env.MERCADOPAGO_PAYMENT_LINK` (sync now, no longer async — callers updated). Falls back to `DEFAULT_MERCADOPAGO_PAYMENT_LINK`.
- [x] 2.2 `getPixSettings(): PixSettings | null` added, reading the four `PIX_*` env vars; returns `null` if any is missing/empty, or if `PIX_KEY_TYPE` isn't one of `cpf`/`email`/`phone`/`random` (logged server-side, not a crash).

## 3. Remove the write paths

- [x] 3.1 Removed `setMercadopagoPaymentLink` and `savePixSettings` from `src/app/actions/admin-settings.ts` (left a comment explaining why, pointing at this change).
- [x] 3.2 Deleted `MercadopagoLinkForm.tsx` and `PixSettingsForm.tsx`.

## 4. Admin settings page: read-only

- [x] 4.1 Rewrote `src/app/admin/settings/page.tsx`: drops the direct Mongo `settings` queries entirely, reads both fields via `getMercadopagoPaymentLink()`/`getPixSettings()`, renders both read-only (value + which env var controls it) plus a banner explaining why. PIX-unconfigured state renders a plain instructional message instead of erroring.
- [x] 4.2 Checkout Pro toggle section left untouched.

## 5. Public page

- [x] 5.1 `src/app/presentes/page.tsx`: replaced the direct `settings.findOne({ key: "pix" })` query with `getPixSettings()`. Same graceful-degradation behavior when unconfigured (PIX section conditionally omitted).

## 6. Verify

- [x] 6.1 `npx tsc --noEmit` and `npm run lint` clean — zero new errors/warnings; same two pre-existing unrelated errors as before (`ConstructionBanner.tsx`, `Countdown.tsx`).
- [x] 6.2 `git grep -n '"pix"\|mercadopago_payment_link'` in `src/` — no matches. No remaining read/write against those DB keys.
- [ ] 6.3 Manual (post-deploy, after task 1.2): confirm `/presentes` still renders the PIX section and the correct MP link; confirm `/admin/settings` shows both as read-only.
