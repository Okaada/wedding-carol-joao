# gift-multi-purchase Specification

## Purpose
TBD - created by archiving change gift-multi-purchase. Update Purpose after archive.
## Requirements
### Requirement: Gift carries a single-purchase toggle
The `Gift` data model SHALL include a boolean field `singlePurchase`. When `true`, the gift locks after the first successful claim or approved payment (legacy behavior). When `false` (the default for new gifts), the gift never leaves `status: "available"` due to a purchase; it accepts unlimited claims and payments.

#### Scenario: New gift defaults to multi-purchase
- **WHEN** an admin creates a gift without explicitly toggling "Compra única?"
- **THEN** the persisted gift has `singlePurchase: false`

#### Scenario: Admin opts a gift into single-purchase
- **WHEN** an admin checks "Compra única?" on the gift form and saves
- **THEN** the persisted gift has `singlePurchase: true` and follows the legacy lock-on-first-purchase flow

### Requirement: Admin gift form exposes the "Compra única?" toggle
The admin gift form (create and edit) SHALL render a checkbox labeled "Compra única?" in pt-BR. The checkbox SHALL be unchecked by default for new gifts, and SHALL reflect the persisted `singlePurchase` value when editing.

#### Scenario: Checkbox unchecked by default on new gift
- **WHEN** an admin opens `/admin/gifts/new`
- **THEN** the "Compra única?" checkbox is rendered unchecked

#### Scenario: Checkbox reflects saved value on edit
- **WHEN** an admin opens the edit page of a gift that has `singlePurchase: true`
- **THEN** the "Compra única?" checkbox is rendered checked

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

### Requirement: Existing gifts are migrated to multi-purchase
A one-shot migration script SHALL run against the `gifts` collection and (a) set `singlePurchase: false` on every document missing the field, (b) initialize `purchases: []` on every document missing the field, and (c) reset any document with `status` in (`"reserved"`, `"claimed"`) back to `status: "available"` with `reservedAt`, `claimedBy`, and `claimedAt` set to `null`. The script SHALL preserve documents with `status: "purchased"`. The script SHALL be idempotent so re-running it is a no-op.

#### Scenario: Migration backfills new fields on legacy documents
- **WHEN** the migration runs against a collection where documents do not have `singlePurchase` or `purchases`
- **THEN** every document gains `singlePurchase: false` and `purchases: []`

#### Scenario: Migration unlocks previously reserved or claimed gifts
- **WHEN** a gift has `status: "reserved"` with a non-null `reservedAt` before migration
- **THEN** after migration its `status` is `"available"`, `reservedAt` / `claimedBy` / `claimedAt` are `null`, and `purchases[]` is `[]`

#### Scenario: Migration preserves purchased gifts
- **WHEN** a gift has `status: "purchased"` with a non-null `paymentId` before migration
- **THEN** after migration its `status` is still `"purchased"` and `paymentId` is unchanged; `singlePurchase: false` and `purchases: []` are added if missing

#### Scenario: Migration is safe to re-run
- **WHEN** the migration is run a second time on a collection that already has the new fields
- **THEN** no document is modified beyond fields that still mismatch the expected shape

