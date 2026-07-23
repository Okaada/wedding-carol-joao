## MODIFIED Requirements

### Requirement: Gift carries an embedded purchase history
The `Gift` data model SHALL include `purchases: Purchase[]`. Every successful claim (external/PIX flow) and every admin-confirmed Mercado Pago intent SHALL append one `Purchase` entry containing `source` (`"claim"` or `"mercadopago"`), `buyerType`, `buyerName`, `buyerNames`, `paymentId` (always `null` after the open-link migration; legacy entries may have a string MP transaction id), and `purchasedAt` (ISO timestamp). The array SHALL be initialized to `[]` for new gifts.

#### Scenario: First claim on a multi-purchase gift appends an entry
- **WHEN** a guest claims a multi-purchase gift via the claim endpoint with buyerName "Ana" and buyerType "individual"
- **THEN** the gift document gains one entry in `purchases[]` with `source: "claim"`, `buyerName: "Ana"`, `paymentId: null`, and a `purchasedAt` ISO timestamp
- **AND** the gift's top-level `status` remains `"available"`

#### Scenario: Admin-confirmed MP intent on a multi-purchase gift appends an entry
- **WHEN** an admin clicks "Confirmar" on a pending payment for a multi-purchase gift
- **THEN** the gift document gains one entry in `purchases[]` with `source: "mercadopago"`, the buyer info from the pending payment row, `paymentId: null`, and a `purchasedAt` timestamp
- **AND** the gift's top-level `status` remains `"available"`

### Requirement: Multi-purchase gifts skip the Mercado Pago reservation
For gifts with `singlePurchase: false`, the checkout endpoint SHALL create the `pending_payments` row without writing any reservation state to the gift document. The gift document SHALL NOT enter the `"reserved"` status as part of an MP checkout for multi-purchase gifts.

#### Scenario: Concurrent MP checkouts on a multi-purchase gift
- **WHEN** two guests start a Mercado Pago checkout on the same multi-purchase gift within the same minute
- **THEN** both checkouts succeed, each receives its own `pending_payments` row and the shared payment link URL, and the gift document remains `status: "available"` throughout

#### Scenario: MP checkout failure does not need rollback
- **WHEN** the checkout endpoint fails to insert the `pending_payments` row for a multi-purchase gift
- **THEN** the endpoint returns an error to the caller and performs no rollback write (because no reservation was created)

## REMOVED Requirements

### Requirement: Mercado Pago webhook is idempotent per payment for multi-purchase gifts
**Reason**: The MP webhook is deleted. Multi-purchase gifts are now appended via admin-confirmed pending payments, which are inherently single-action per row (admin only clicks Confirmar once).
**Migration**: Replaced by the "Admin confirms a pending payment for a multi-purchase gift" scenario in the new `mp-open-link-checkout` capability. No data migration; in-flight MP webhook deliveries during the deploy window are reconciled manually by the admin from the MP dashboard.

### Requirement: External reference encodes buyer info for multi-purchase MP checkouts
**Reason**: There is no MP `Preference` to populate. Buyer info is captured locally in `pending_payments` and never traverses Mercado Pago, eliminating the 200-character `external_reference` constraint and the encode/decode pair.
**Migration**: `src/lib/external-reference.ts` is removed. Buyer info for MP-intent rows lives in `pending_payments.buyerInfo`. No data migration needed for past MP-paid gifts: their `purchases[]` entries already contain the decoded buyer info.
