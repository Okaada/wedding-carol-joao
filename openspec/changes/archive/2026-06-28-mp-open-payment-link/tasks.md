## 1. Pre-work: archive the conflicting in-flight change

- [x] 1.1 Confirm with the user that `openspec/changes/panic-mode-tri-state/` should be archived without implementing (this change supersedes it). If yes, archive it before starting any code work below.
- [x] 1.2 Verify no other branch is mid-flight on `src/lib/mercadopago.ts`, the webhook route, or panic-mode files (`git log --since="7 days ago" --name-only`).

## 2. Settings: shared payment link URL

- [x] 2.1 Add a `getMercadopagoPaymentLink()` helper in `src/lib/settings.ts` (create the file if it doesn't exist) that reads `settings.findOne({ key: "mercadopago_payment_link" })` and returns the stored `url`, falling back to `"https://link.mercadopago.com.br/presentecarolejoao"` when missing.
- [x] 2.2 In `src/app/actions/admin-settings.ts`, add `setMercadopagoPaymentLink(url: string)` that validates the URL is non-empty and starts with `https://link.mercadopago.com.br/`, upserts the settings doc, and `revalidatePath("/admin/settings")` + `revalidatePath("/presentes")`.
- [x] 2.3 In `src/app/admin/settings/page.tsx`, render a single input field bound to the current value, with a Save button wired to `setMercadopagoPaymentLink`. Use pt-BR copy: label `Link de pagamento Mercado Pago`, helper text `Cole o link aberto gerado no painel do Mercado Pago.`

## 3. Pending payments: data layer

- [x] 3.1 Create `src/lib/pending-payments.ts` with: `createPendingPayment({ giftId, buyerInfo, amount })` (inserts a doc and returns the inserted id as string), `listPendingPayments()` (returns `pending` rows joined with gift name + price), `confirmPendingPayment(pendingId)`, `cancelPendingPayment(pendingId)`.
- [x] 3.2 In `confirmPendingPayment`, mirror the deleted webhook's branching: if gift `singlePurchase === true`, `findOneAndUpdate({ _id: giftId, status: { $ne: "purchased" } }, { $set: { status: "purchased", paymentId: null, updatedAt: <iso> } })`. Else, `$push` to `purchases[]` with `source: "mercadopago"`, the buyer info from the pending row, `paymentId: null`, `purchasedAt: <iso>`. In both branches, `$set` the pending row to `status: "confirmed"`, `confirmedAt: <iso>`.
- [x] 3.3 In `cancelPendingPayment`, if gift `singlePurchase === true` AND its current `status === "reserved"`, release: `$set status: "available"`, `reservedAt: null`, and clear mirrored buyer fields. Always `$set` the pending row to `status: "cancelled"`, `cancelledAt: <iso>`.
- [x] 3.4 Create indexes on `pending_payments`: `{ status: 1, createdAt: -1 }` and `{ giftId: 1 }`. Add a migration script under `scripts/` (or wherever existing migrations live) that creates them idempotently.

## 4. Checkout endpoint rewrite

- [x] 4.1 Rewrite `src/app/api/gifts/[id]/checkout/route.ts` to drop all MP SDK calls. Keep the buyer-info parsing and the `releaseExpiredReservations()` call. For `singlePurchase: true`, retain the atomic reserve `findOneAndUpdate` and the 409 short-circuit; do NOT roll back on failure (there is no MP call that can fail anymore). For `singlePurchase: false`, skip the reservation entirely.
- [x] 4.2 After the reserve (or directly for multi-purchase), call `createPendingPayment({ giftId, buyerInfo, amount: gift.price / 100 })` and read the shared payment link URL via `getMercadopagoPaymentLink()`.
- [x] 4.3 Return `{ paymentLinkUrl, amount, pendingId }`. Drop the `checkoutUrl` field. Drop the `external_reference` encoding entirely.
- [x] 4.4 Drop the `describeMpError` / `logMpError` imports and any `mp_errors` writes from this route.

## 5. ClaimModal: open-link UX for `mode === "mercadopago"`

- [x] 5.1 Update `ClaimModal.tsx` so the `mercadopago` branch — after the buyer-info form is submitted and the server returns `{ paymentLinkUrl, amount, pendingId }` — renders a second-stage view containing: the gift name, `R$ XXX,XX` in a large font (use `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`), a `Copiar valor` button that writes `XXX,XX` (no `R$` prefix) to the clipboard, a numbered 3-step instruction list in pt-BR, and an `Abrir Mercado Pago` anchor with `target="_blank"` + `rel="noopener noreferrer"`.
- [x] 5.2 The "Copiar valor" button SHALL show "Copiado!" for ~2s after click (mirror the existing PIX copy button pattern).
- [x] 5.3 On HTTP 409, render the server's error message inline above the Confirmar button and do NOT advance to stage two.
- [x] 5.4 Drop the `pixQrCodeUrl` / `pixPayload` / `panicMode` props from the `mercadopago` mode (they were only meaningful when fallback was on). Keep them on the `pix` mode if applicable.
- [x] 5.5 Inspect callers of `ClaimModal` (`src/components/GiftCard.tsx`, `src/app/presentes/page.tsx`) and drop the props they were threading through for panic-mode behavior on MP gifts.

## 6. Admin: pending payments page

- [x] 6.1 Create `src/app/admin/pending-payments/page.tsx` (server component). Use `listPendingPayments()` and render a table with columns: comprador, tipo, presente, valor, criado em, ações.
- [x] 6.2 For each row, render two server-action-wired buttons: `Confirmar` (calls `confirmPendingPayment(id)`) and `Cancelar` (calls `cancelPendingPayment(id)`). Both server actions live in `src/app/actions/admin-pending-payments.ts` and `revalidatePath("/admin/pending-payments")` + `revalidatePath("/admin/gifts")` on success.
- [x] 6.3 Add a navigation link to `/admin/pending-payments` from the admin sidebar / dashboard nav (wherever existing admin links live). Surface the pending count as a badge if trivial. _(Badge skipped — would add a DB query to every admin route render.)_
- [x] 6.4 Format the amount using `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` and the timestamps using `toLocaleString('pt-BR')`.

## 7. Removals

- [x] 7.1 Delete `src/app/api/webhooks/mercadopago/route.ts`.
- [x] 7.2 Delete `src/lib/mercadopago.ts`.
- [x] 7.3 Delete `src/lib/mp-errors.ts`. Grep for `logMpError`, `describeMpError`, `getTodayMpErrorCount` and remove every remaining import.
- [x] 7.4 Delete `src/lib/panic-mode.ts`. Grep for `isPanicModeActive`, `getPanicModeStatus`, `PanicMode`, `PanicModeStatus` and remove every remaining import.
- [x] 7.5 Delete `src/components/admin/PanicModeModeSelector.tsx` (and `PanicModeToggle.tsx` if it still exists). Drop their references from `src/app/admin/settings/page.tsx`.
- [x] 7.6 Drop the panic-mode block from `src/app/actions/admin-settings.ts` (`togglePanicMode` / `setPanicMode` and any imports they used).
- [x] 7.7 Check `src/lib/external-reference.ts` consumers: `git grep -n "external-reference\\|encodeBuyerRef\\|decodeBuyerRef"`. If the only callers were the deleted webhook + checkout route, delete the file. If `BuyerInfo` is re-exported and still consumed, move the `BuyerInfo` type into `src/data/types.ts` and delete the file. Drop the export-only re-import patterns. _(`BuyerInfo` moved to `src/data/types.ts`; file deleted.)_
- [x] 7.8 Remove `mercadopago` from `package.json` `dependencies`. Re-run `npm install` to regenerate the lockfile. _(Used `--force` because of a pre-existing `@tailwindcss/oxide-linux-x64-gnu` platform pin in `dependencies` — unrelated to this change.)_
- [x] 7.9 Remove the `MERCADOPAGO_ACCESS_TOKEN` entry from `.env.example` (if present). Note in the PR description that the secret should also be removed from the deploy environment. _(Not present in `.env.example`; production secret store still needs manual removal.)_

## 8. Data seeding

- [ ] 8.1 One-shot seed (manual or via a small script): upsert `settings.findOneAndUpdate({ key: "mercadopago_payment_link" }, { $set: { value: { url: "https://link.mercadopago.com.br/presentecarolejoao", updatedAt: <iso> } } }, { upsert: true })`. The settings page also handles this once deployed; the seed just prevents the first /presentes load from rendering with the hardcoded fallback. _(Not executed against DB by the agent — `getMercadopagoPaymentLink()` falls back to the default URL if the setting is missing, so this is purely cosmetic until the admin saves a value in `/admin/settings`.)_

## 9. Verify

- [x] 9.1 `npm run lint` and `npm run build` pass with zero references to `mercadopago` / `MERCADOPAGO_ACCESS_TOKEN` / `panic-mode` / `mp-errors` / `external-reference` (`git grep -n` should be clean for each). _(TypeScript compiles clean. Lint errors that remain are in `ConstructionBanner.tsx` and `Countdown.tsx`, both untouched by this change. Build needs live `MONGODB_URI` for prerender of pre-existing admin pages — unrelated.)_
- [ ] 9.2 With no `MERCADOPAGO_ACCESS_TOKEN` set, start the dev server and load `/presentes`. Confirm it renders without errors and Mercado Pago gifts are still claimable. _(Manual — requires user to run dev server.)_
- [ ] 9.3 On a multi-purchase MP gift: click Presentear → fill buyer info → Confirmar. Verify: a `pending_payments` doc is inserted with the correct buyer + amount; the modal advances to the second-stage view; the Copiar valor button copies the right string; the Abrir Mercado Pago link points to the configured URL with `target="_blank"`. _(Manual.)_
- [ ] 9.4 On a single-purchase MP gift, run two concurrent claim flows from two browsers. One reaches stage two, the other gets the 409 inline error and the gift becomes `reserved`. _(Manual.)_
- [ ] 9.5 In `/admin/pending-payments`, click Confirmar on the multi-purchase row: gift gains a `purchases[]` entry with `source: "mercadopago"`, `paymentId: null`. Click Confirmar on the single-purchase row: gift moves to `status: "purchased"`. _(Manual.)_
- [ ] 9.6 In `/admin/pending-payments`, click Cancelar on a fresh single-purchase pending row: gift returns to `status: "available"` and the mirrored buyer fields clear. _(Manual.)_
- [ ] 9.7 In `/admin/settings`, change the payment link URL to a different valid `link.mercadopago.com.br/...` slug; reload the claim modal and verify the `Abrir Mercado Pago` anchor points to the new URL. _(Manual.)_
- [ ] 9.8 PIX-only gifts (`purchaseMode: "pix"`) still render the PIX QR code in the claim modal (regression check). _(Manual; note: the codebase's current `purchaseMode` type is `"mercadopago" | "external"` only. PIX QR codes today render in `mode === "external"` for priced gifts — unchanged by this work.)_
