## MODIFIED Requirements

### Requirement: Gift carries an embedded purchase history
The `Gift` data model SHALL include `purchases: Purchase[]`. Every successful claim (external/PIX flow), every admin-confirmed Mercado Pago intent, and every webhook-auto-confirmed Mercado Pago intent SHALL append one `Purchase` entry containing `source` (`"claim"` or `"mercadopago"`), `buyerType`, `buyerName`, `buyerNames`, `paymentId` (`null` for claims and admin-manual confirmations; the real Mercado Pago transaction id string for webhook-auto-confirmed Checkout Pro payments), and `purchasedAt` (ISO timestamp). The array SHALL be initialized to `[]` for new gifts.

#### Scenario: First claim on a multi-purchase gift appends an entry
- **WHEN** a guest claims a multi-purchase gift via the claim endpoint with buyerName "Ana" and buyerType "individual"
- **THEN** the gift document gains one entry in `purchases[]` with `source: "claim"`, `buyerName: "Ana"`, `paymentId: null`, and a `purchasedAt` ISO timestamp
- **AND** the gift's top-level `status` remains `"available"`

#### Scenario: Admin-confirmed MP intent on a multi-purchase gift appends an entry
- **WHEN** an admin clicks "Confirmar" on a pending payment for a multi-purchase gift
- **THEN** the gift document gains one entry in `purchases[]` with `source: "mercadopago"`, the buyer info from the pending payment row, `paymentId: null`, and a `purchasedAt` timestamp
- **AND** the gift's top-level `status` remains `"available"`

#### Scenario: Webhook-auto-confirmed MP intent on a multi-purchase gift appends an entry
- **WHEN** a signature-verified Mercado Pago webhook auto-confirms a pending payment for a multi-purchase gift
- **THEN** the gift document gains one entry in `purchases[]` with `source: "mercadopago"`, the buyer info from the pending payment row, `paymentId` set to the real Mercado Pago transaction id, and a `purchasedAt` timestamp
- **AND** the gift's top-level `status` remains `"available"`

### Requirement: Multi-purchase gifts skip the Mercado Pago reservation
For gifts with `singlePurchase: false`, the checkout endpoint SHALL create the `pending_payments` row without writing any reservation state to the gift document, regardless of whether the eventual checkout path is the open payment link or Checkout Pro. The gift document SHALL NOT enter the `"reserved"` status as part of an MP checkout for multi-purchase gifts.

#### Scenario: Concurrent MP checkouts on a multi-purchase gift
- **WHEN** two guests start a Mercado Pago checkout on the same multi-purchase gift within the same minute
- **THEN** both checkouts succeed, each receives its own `pending_payments` row, and the gift document remains `status: "available"` throughout

#### Scenario: MP checkout failure does not need rollback
- **WHEN** the checkout endpoint fails to insert the `pending_payments` row for a multi-purchase gift
- **THEN** the endpoint returns an error to the caller and performs no rollback write (because no reservation was created)
