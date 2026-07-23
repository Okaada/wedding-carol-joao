## MODIFIED Requirements

### Requirement: Shared payment link URL sourced from the server environment
The Mercado Pago open payment link SHALL be read from `process.env.MERCADOPAGO_PAYMENT_LINK`. There SHALL be no admin UI or server action that writes this value to a database. When the environment variable is unset, the system SHALL fall back to the default URL `https://link.mercadopago.com.br/presentecarolejoao`.

#### Scenario: Payment link read from environment
- **WHEN** the checkout endpoint needs the shared payment link
- **THEN** it returns the value of `MERCADOPAGO_PAYMENT_LINK` if set

#### Scenario: Payment link missing falls back to default
- **WHEN** `MERCADOPAGO_PAYMENT_LINK` is not set in the server environment
- **AND** a buyer triggers the Mercado Pago checkout flow
- **THEN** the checkout response includes `paymentLinkUrl: "https://link.mercadopago.com.br/presentecarolejoao"`

## REMOVED Requirements

### Requirement: Shared payment link URL stored in settings
**Reason**: Superseded by the `payment-destination-config` capability. Storing the payment destination in an admin-writable database collection meant anyone with a valid admin session (stolen cookie, phished credentials, etc.) could silently redirect guest payments to a different account. Moving it to a server environment variable requires deploy-platform access to change, a materially higher bar.
**Migration**: The `settings.mercadopago_payment_link` document is left in place, unread, unwritten. No data migration; whoever manages the deploy sets `MERCADOPAGO_PAYMENT_LINK` to the value that was previously in that document before this change ships (see the parent proposal's migration plan).
