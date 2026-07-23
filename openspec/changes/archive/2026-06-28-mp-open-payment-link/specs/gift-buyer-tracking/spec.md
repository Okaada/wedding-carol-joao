## MODIFIED Requirements

### Requirement: Gift data model includes buyer information
The `Gift` interface SHALL track buyer identity for every successful purchase. For `singlePurchase: true` gifts, the gift document SHALL continue to store the legacy single-buyer fields (`buyerType`, `buyerName`, `buyerNames`) on the gift document itself. For `singlePurchase: false` gifts, buyer information SHALL live as entries inside the gift's `purchases[]` array (one entry per claim or admin-confirmed Mercado Pago intent). The legacy single-buyer fields MAY also be populated on multi-purchase gifts (mirroring the most recent buyer), but the `purchases[]` array is the source of truth.

#### Scenario: Buyer fields stored on claim for single-purchase gift
- **WHEN** a gift with `singlePurchase: true` is claimed via the claim endpoint
- **THEN** the gift document stores `buyerType`, `buyerName`, and `buyerNames` on the top-level document (legacy behavior)
- **AND** a corresponding entry is also appended to `purchases[]`

#### Scenario: Buyer fields stored on Mercado Pago intent for single-purchase gift
- **WHEN** a gift with `singlePurchase: true` is reserved via the checkout endpoint with buyer info
- **THEN** the gift document stores the buyer fields on the top-level document alongside the reservation
- **AND** a `pending_payments` row also carries the same buyer info

#### Scenario: Multi-purchase claim appends to purchases[]
- **WHEN** a gift with `singlePurchase: false` is claimed
- **THEN** a new entry with `source: "claim"`, `paymentId: null`, and the buyer info is appended to `purchases[]`
- **AND** no top-level `status` change occurs

#### Scenario: Multi-purchase admin-confirmed MP intent appends to purchases[]
- **WHEN** an admin clicks "Confirmar" on a pending payment for a gift with `singlePurchase: false`
- **THEN** a new entry with `source: "mercadopago"`, the buyer info from the pending payment row, `paymentId: null`, and a `purchasedAt` timestamp is appended to `purchases[]`
- **AND** no top-level `status` change occurs

#### Scenario: Gift without buyer info
- **WHEN** a gift has not been claimed or purchased
- **THEN** `purchases` is `[]` (the legacy top-level `buyerType`/`buyerName`/`buyerNames` are `null` for `singlePurchase: true` gifts)
