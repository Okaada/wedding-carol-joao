## Why

Two fields editable from `/admin/settings` control where guests' money actually goes: the Mercado Pago open payment link (`settings.mercadopago_payment_link.url`) and the PIX key (`settings.pix.value.keyValue`, plus recipient name/city). Both are currently stored in MongoDB and writable by anyone holding a valid admin session, with no additional confirmation step.

This is the single highest-value tampering target in the whole application. Every other admin capability (editing a gift's name, marking something purchased, exporting a CSV) causes annoyance or a data-integrity headache if abused. Silently swapping the payment link or PIX key redirects real money from real guests to an attacker's own account, with no fraud detection anywhere in this codebase to catch it. An attacker who obtains a valid admin session — via a phished password, a leaked cookie, a session-fixation bug, or simply a weak password despite the existing lockout — can currently do this in two form submits.

Moving these two fields to server environment variables does not defend against every threat (an attacker with actual RCE on the server can read env vars too), but it meaningfully raises the bar for the most realistic threat: **admin-session compromise without deploy-platform compromise**. Vercel (or wherever this is hosted) project settings are a materially higher-friction target than the site's own login form, and typically sit behind separate credentials/2FA. With this change, an attacker who steals an admin session can no longer redirect payments at all — they'd need to compromise the hosting platform account too.

## What Changes

- **BREAKING**: `getMercadopagoPaymentLink()` no longer reads `settings.mercadopago_payment_link`. It reads `process.env.MERCADOPAGO_PAYMENT_LINK`, falling back to the existing default (`https://link.mercadopago.com.br/presentecarolejoao`) when unset.
- **BREAKING**: PIX settings (`keyType`, `keyValue`, `recipientName`, `city`) no longer come from `settings.pix`. A new `getPixSettings()` reads all four from `PIX_KEY_TYPE`, `PIX_KEY_VALUE`, `PIX_RECIPIENT_NAME`, `PIX_CITY`. If any is missing, PIX display is treated as "not configured" (same graceful-degradation behavior as today when the DB doc was absent).
- **REMOVED**: `setMercadopagoPaymentLink` and `savePixSettings` server actions, and the two admin form components (`MercadopagoLinkForm`, `PixSettingsForm`) that wrote through them.
- **NEW**: `/admin/settings` shows both values read-only, sourced from the server environment, with a note that changing them requires updating the deploy environment (not a page reload). Values are not secrets (both are already shown to every guest on the public `/presentes` page today), so no masking is needed — this is a tamper-resistance change, not a confidentiality change.
- **NOT changed**: the Checkout Pro feature flag (`mercadopago_checkout_pro`) stays in `settings`, admin-toggleable. Flipping it changes which checkout UI a guest sees; it does not change where money goes (the Mercado Pago account is determined server-side by `MERCADOPAGO_ACCESS_TOKEN`, already env-only). It is not a comparable tampering target and moving it to env would only cost convenience for no security gain.

## Capabilities

### New Capabilities
- `payment-destination-config`: Mercado Pago payment link and PIX receiving key are sourced exclusively from server environment variables, not from any admin-writable data store.

### Modified Capabilities
- `mp-open-link-checkout`: "Shared payment link URL stored in settings" is replaced — the URL is now environment-sourced and admin-read-only.
- `gift-pix-checkout`: requirement language updated from "PIX settings are configured in the admin panel" to "PIX settings are configured in the server environment."

## Impact

**Code**: `src/lib/settings.ts` (both getters rewritten), `src/app/actions/admin-settings.ts` (two actions removed), `src/app/admin/settings/page.tsx` (rewritten to read-only display), `src/app/presentes/page.tsx` (reads PIX via the new `getPixSettings()` helper instead of querying `settings` directly). Removed: `src/components/admin/MercadopagoLinkForm.tsx`, `src/components/admin/PixSettingsForm.tsx`.

**Data**: no migration script. The `settings.mercadopago_payment_link` and `settings.pix` documents are left in place, inert (same "deprecate, don't delete" pattern used by prior hardening changes in this repo).

**Deploy — action required before merging**: the current values must be copied from `/admin/settings` (as currently displayed) into the deploy platform's environment variables *before* this change goes live, or the site silently reverts to the hardcoded default payment link and the PIX section disappears from the public page. This is a manual, one-time step — see `tasks.md`.

**Trade-off accepted**: neither the payment link slug nor the PIX key can be changed without a deploy platform env var edit going forward. For a wedding site with essentially one operator, this is judged worth it given what's being protected.
