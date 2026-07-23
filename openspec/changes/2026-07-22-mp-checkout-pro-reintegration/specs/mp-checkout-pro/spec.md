## ADDED Requirements

### Requirement: Checkout Pro feature flag stored in settings
The `settings` collection SHALL store a boolean flag under `key: "mercadopago_checkout_pro"` with `value: { enabled: boolean, updatedAt: string }`. The admin settings page SHALL render a toggle that reads and writes this value. When the document is missing, the system SHALL treat Checkout Pro as disabled.

#### Scenario: Admin enables the flag
- **WHEN** the admin toggles "Checkout Pro (Mercado Pago)" to on
- **THEN** the `settings` document `{ key: "mercadopago_checkout_pro" }` is upserted with `value: { enabled: true, updatedAt: <iso> }`

#### Scenario: Admin disables the flag
- **WHEN** the admin toggles "Checkout Pro (Mercado Pago)" to off
- **THEN** the `settings` document is updated with `value: { enabled: false, updatedAt: <iso> }`
- **AND** subsequent checkouts use the open-link flow exclusively

#### Scenario: Flag missing defaults to disabled
- **WHEN** the `settings` collection has no `mercadopago_checkout_pro` document
- **THEN** the checkout endpoint behaves as if the flag is `false`

### Requirement: Mercado Pago credentials are environment-only
`MERCADOPAGO_ACCESS_TOKEN` and `MERCADOPAGO_WEBHOOK_SECRET` SHALL be read only from process environment variables. Neither value SHALL be persisted to the `settings` collection or any other database collection, and no admin UI form SHALL accept either value as input. The admin settings page MAY display whether a token is currently configured (boolean) but SHALL NOT display or accept the token value itself.

#### Scenario: Settings page shows configuration status without the secret
- **WHEN** `MERCADOPAGO_ACCESS_TOKEN` is set in the server environment
- **AND** the admin opens `/admin/settings`
- **THEN** the page shows "Chave de acesso configurada: Sim"
- **AND** no form field anywhere on the page renders or accepts the token value

#### Scenario: Enabling the flag without a configured token is a no-op
- **WHEN** the admin enables the Checkout Pro flag
- **AND** `MERCADOPAGO_ACCESS_TOKEN` is not set in the server environment
- **THEN** the flag is stored as enabled
- **AND** every checkout continues to receive the open-link response (`paymentLinkUrl`), not a Checkout Pro response

### Requirement: Checkout endpoint creates a Mercado Pago Preference when enabled and configured
When the Checkout Pro flag is enabled and `MERCADOPAGO_ACCESS_TOKEN` is configured, the `POST /api/gifts/[id]/checkout` endpoint SHALL, after creating the `pending_payments` row (unchanged from the open-link flow), attempt to create a Mercado Pago `Preference` with `external_reference` set to the `pending_payments` row's id, and SHALL return `{ checkoutUrl: <preference.init_point>, amount, pendingId }` on success.

#### Scenario: Checkout Pro succeeds
- **WHEN** the flag is enabled, the token is configured, and Preference creation succeeds for a gift checkout
- **THEN** the response is `{ checkoutUrl: <MP init_point URL>, amount, pendingId }` with HTTP 200
- **AND** the `pending_payments` row gains an `mpPreferenceId` field matching the created preference

#### Scenario: Preference creation fails, falls back to open-link response
- **WHEN** the flag is enabled and the token is configured, but the Mercado Pago API call fails (network error, invalid token, rate limit, etc.)
- **THEN** the endpoint does NOT return an error to the guest
- **AND** the endpoint returns the same `{ paymentLinkUrl, amount, pendingId }` response the open-link flow would have returned
- **AND** the `pending_payments` row created for this attempt remains valid and reconcilable from `/admin/pending-payments`

#### Scenario: Flag disabled skips Checkout Pro entirely
- **WHEN** the Checkout Pro flag is disabled
- **THEN** the checkout endpoint makes no Mercado Pago API call
- **AND** the response is the existing open-link shape, unchanged

### Requirement: Webhook verifies Mercado Pago's signature before processing
`POST /api/webhooks/mercadopago` SHALL validate the `x-signature` and `x-request-id` headers against `MERCADOPAGO_WEBHOOK_SECRET` using the manifest `id:{data.id};request-id:{x-request-id};ts:{ts};` (HMAC-SHA256, matching Mercado Pago's documented scheme) before taking any action. Requests that fail validation, or requests received while `MERCADOPAGO_WEBHOOK_SECRET` is unset, SHALL be rejected with HTTP 401 and SHALL NOT read or write any `pending_payments` or `gifts` document.

#### Scenario: Valid signature is accepted
- **WHEN** a webhook POST arrives with a correctly computed `x-signature` for the configured secret
- **THEN** the request proceeds to payment processing

#### Scenario: Invalid signature is rejected
- **WHEN** a webhook POST arrives with an `x-signature` that does not match the computed HMAC for the configured secret
- **THEN** the response is HTTP 401
- **AND** no database read or write occurs

#### Scenario: Secret not configured fails closed
- **WHEN** `MERCADOPAGO_WEBHOOK_SECRET` is not set in the server environment
- **AND** any request (signed or not) arrives at the webhook route
- **THEN** the response is HTTP 401
- **AND** no database read or write occurs

### Requirement: Approved payment auto-confirms the matching pending payment
On a signature-verified webhook for an `approved` payment, the system SHALL look up the `pending_payments` document whose `_id` equals the payment's `external_reference`, and SHALL call the same confirmation logic used by the admin's manual "Confirmar" action, passing the real Mercado Pago payment id.

#### Scenario: Single-purchase gift auto-confirms
- **WHEN** an approved payment webhook is received whose `external_reference` matches a pending row for a `singlePurchase: true` gift currently `status: "reserved"`
- **THEN** the gift document is updated to `status: "purchased"`, `paymentId: <mp payment id>`, `updatedAt: <iso>`
- **AND** the pending row is updated to `status: "confirmed"`, `confirmedAt: <iso>`

#### Scenario: Multi-purchase gift auto-confirms
- **WHEN** an approved payment webhook is received whose `external_reference` matches a pending row for a `singlePurchase: false` gift
- **THEN** a new entry is appended to the gift's `purchases[]` with `source: "mercadopago"`, the buyer info from the pending row, `paymentId: <mp payment id>`, and `purchasedAt: <iso>`
- **AND** the pending row is updated to `status: "confirmed"`, `confirmedAt: <iso>`

#### Scenario: Non-approved payment status is ignored
- **WHEN** a signature-verified webhook is received for a payment whose status is not `"approved"` (e.g. `"pending"`, `"rejected"`)
- **THEN** the endpoint returns HTTP 200 and makes no `pending_payments` or `gifts` write

#### Scenario: No matching pending payment
- **WHEN** a signature-verified, approved-payment webhook's `external_reference` does not match any `pending_payments` document
- **THEN** the endpoint returns HTTP 200 and makes no write (nothing to reconcile; logged server-side for investigation)

#### Scenario: Duplicate webhook delivery is idempotent
- **WHEN** a signature-verified webhook for a payment is received twice (Mercado Pago retry behavior)
- **AND** the matching pending row already has `status: "confirmed"`
- **THEN** the second delivery makes no additional write and still returns HTTP 200

### Requirement: Guest is redirected directly into Mercado Pago's hosted checkout for Checkout Pro responses
The `ClaimModal` component SHALL, when the checkout endpoint response contains `checkoutUrl` (Checkout Pro path), navigate the browser to that URL immediately rather than rendering the copy-the-amount instructional stage used for the open-link response.

#### Scenario: Checkout Pro response redirects immediately
- **WHEN** the checkout endpoint returns `{ checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?...", amount: 150, pendingId: "..." }`
- **THEN** the browser navigates to the returned `checkoutUrl` without showing the "Copiar valor" / 3-step instructions stage

#### Scenario: Open-link response still shows the instructional stage
- **WHEN** the checkout endpoint returns `{ paymentLinkUrl: "...", amount: 150, pendingId: "..." }` (no `checkoutUrl`)
- **THEN** the modal renders the existing amount/copy/instructions stage unchanged
