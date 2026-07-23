## ADDED Requirements

### Requirement: Payment destination values are environment-sourced only
The Mercado Pago open payment link and the PIX receiving key (type, value, recipient name, city) SHALL be read exclusively from server environment variables. No code path SHALL write these values to the `settings` collection or any other database collection, and no admin UI SHALL accept them as form input.

#### Scenario: Mercado Pago payment link sourced from environment
- **WHEN** the checkout flow needs the shared open payment link
- **THEN** the value comes from `process.env.MERCADOPAGO_PAYMENT_LINK`
- **AND** falls back to the hardcoded default `https://link.mercadopago.com.br/presentecarolejoao` when unset

#### Scenario: PIX settings sourced from environment
- **WHEN** the public gift list needs PIX settings to generate a QR code
- **THEN** the values come from `PIX_KEY_TYPE`, `PIX_KEY_VALUE`, `PIX_RECIPIENT_NAME`, `PIX_CITY`
- **AND** if any of the four is missing or empty, PIX is treated as not configured (no QR code section rendered)

#### Scenario: No admin-writable path exists
- **WHEN** the codebase is inspected for server actions or API routes
- **THEN** there is no action that accepts a Mercado Pago payment link URL or a PIX key as user input and persists it

### Requirement: Admin settings page displays payment destination values read-only
`/admin/settings` SHALL display the current Mercado Pago payment link and PIX settings as read-only text, along with the name of the environment variable that controls each, rather than as editable form fields. Values SHALL NOT be masked, since both are already publicly visible on `/presentes`.

#### Scenario: Admin views current payment link
- **WHEN** an admin opens `/admin/settings`
- **THEN** the current Mercado Pago payment link value is shown as text, not an input field
- **AND** a note indicates it is controlled by `MERCADOPAGO_PAYMENT_LINK` in the server environment

#### Scenario: Admin views current PIX settings
- **WHEN** an admin opens `/admin/settings`
- **AND** all four `PIX_*` environment variables are set
- **THEN** the current PIX key type, key value, recipient name, and city are shown as read-only text

#### Scenario: Admin views unconfigured PIX settings
- **WHEN** an admin opens `/admin/settings`
- **AND** one or more `PIX_*` environment variables is unset
- **THEN** the page indicates PIX is not configured, without erroring
