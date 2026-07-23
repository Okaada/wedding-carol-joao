## Context

`/admin/settings` currently lets any authenticated admin session rewrite two values that determine where guest money physically goes: the Mercado Pago open payment link and the PIX key/recipient. Both writes go through a standard server action with only `await auth()` guarding them — the same level of protection as, say, editing a gift's description. The impact of abuse is not comparable: a corrupted gift description is a cosmetic bug; a swapped PIX key is theft from wedding guests with no built-in way to detect it happened.

## Goals / Non-Goals

**Goals:**
- Make the two payment-destination fields untamperable via the admin session alone.
- Do not silently break the public site: PIX section and MP payment link must both keep working the moment this deploys, as long as the env vars are set first.
- Keep the values visible (not masked) in `/admin/settings` — they are not secrets, they are already public on `/presentes`.

**Non-Goals:**
- Defending against full server/RCE compromise (env vars are readable there too — no config-storage choice fixes that class of attack).
- Adding audit logging, 2FA-on-write, or a change-confirmation email flow for these fields. Considered (see Alternatives) and explicitly deferred — bigger scope than what was asked for, revisit only if the env-var approach turns out to be too inconvenient in practice.
- Moving the Checkout Pro flag or any other `settings` doc to env. See proposal.md for why the flag specifically doesn't need this.

## Decisions

### 1. Env vars, not a "confirm with password" write flow

**Alternative considered**: keep DB storage, but require re-entering the admin password (or a second factor) before `setMercadopagoPaymentLink` / `savePixSettings` commits. This narrows the same threat (stolen session cookie without stolen password) but not credential-stuffing/phishing (attacker has the password too), and adds real implementation surface (a new sensitive-action-confirmation pattern, session step-up, etc.) for a two-person operator team. Rejected for now as disproportionate; env vars solve the higher-probability case (session theft) with an order of magnitude less code, at the cost of losing self-serve editability.

### 2. Values stay visible, not masked, in the admin UI

These are not secrets — `PixSection` and the Mercado Pago CTA already render the PIX key and payment link to every anonymous visitor of `/presentes`. Masking them in `/admin/settings` would be theater. The read-only panel shows the current value plus which env var controls it, so whoever has server access knows exactly what to edit.

### 3. Graceful fallback preserved exactly as before

`getPixSettings()` returns `null` when any of the four env vars is missing, matching today's behavior when the `settings.pix` document didn't exist. No new failure mode for a fresh deploy that hasn't set PIX vars yet — the PIX section on `/presentes` simply doesn't render, same as day one of this project.

`getMercadopagoPaymentLink()` keeps its existing hardcoded default when `MERCADOPAGO_PAYMENT_LINK` is unset, so an unconfigured deploy behaves exactly as it does today (falls back to `presentecarolejoao`'s link) rather than breaking.

## Migration Plan

1. **Before merging this branch**: read the current values from `/admin/settings` (the screenshot already confirms the MP link: `https://link.mercadopago.com.br/presentecarolejoao` — that matches the existing hardcoded default, so no action needed there unless it was changed since deploy). Read the current PIX key/name/city the same way.
2. Add `MERCADOPAGO_PAYMENT_LINK`, `PIX_KEY_TYPE`, `PIX_KEY_VALUE`, `PIX_RECIPIENT_NAME`, `PIX_CITY` to the deploy platform's env store with those exact values.
3. Redeploy (env vars need a restart to be picked up — same caveat as `MERCADOPAGO_ACCESS_TOKEN`).
4. Confirm `/presentes` still shows the PIX section and the Mercado Pago CTA still points at the right link.
5. Confirm `/admin/settings` no longer shows editable forms for either field — read-only panels only.

**Rollback**: revert the commit. The old `settings.mercadopago_payment_link` / `settings.pix` documents are still in Mongo (never deleted), so the DB-reading code path would immediately pick them back up.

## Risks / Trade-offs

- **[Env vars not set before deploy]** → PIX section vanishes from the public page (graceful, not a crash) and the payment link silently reverts to the hardcoded default. Mitigated by: step 1-4 of the migration plan being a hard prerequisite, called out explicitly in the proposal.
- **[Convenience loss]** → Any future PIX key rotation or payment link slug change now requires a deploy-platform env edit + restart instead of a form submit. Accepted given what's being protected.
- **[Someone with deploy-platform access is also untrustworthy]** → Out of scope; that's a different, higher-privilege threat than what this change addresses.
