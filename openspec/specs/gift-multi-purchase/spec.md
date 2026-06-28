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
The `Gift` data model SHALL include `purchases: Purchase[]`. Every successful claim (external/PIX flow) and every approved Mercado Pago payment SHALL append one `Purchase` entry containing `source` (`"claim"` or `"mercadopago"`), `buyerType`, `buyerName`, `buyerNames`, `paymentId` (string for MP entries, `null` for claims), and `purchasedAt` (ISO timestamp). The array SHALL be initialized to `[]` for new gifts.

#### Scenario: First claim on a multi-purchase gift appends an entry
- **WHEN** a guest claims a multi-purchase gift via the claim endpoint with buyerName "Ana" and buyerType "individual"
- **THEN** the gift document gains one entry in `purchases[]` with `source: "claim"`, `buyerName: "Ana"`, `paymentId: null`, and a `purchasedAt` ISO timestamp
- **AND** the gift's top-level `status` remains `"available"`

#### Scenario: Approved MP payment on a multi-purchase gift appends an entry
- **WHEN** the Mercado Pago webhook receives an approved payment for a multi-purchase gift, carrying the buyer info encoded in `external_reference`
- **THEN** the gift document gains one entry in `purchases[]` with `source: "mercadopago"`, the buyer info from the encoded payload, `paymentId` set to the MP payment id, and a `purchasedAt` timestamp
- **AND** the gift's top-level `status` remains `"available"`

### Requirement: Multi-purchase gifts skip the Mercado Pago reservation
For gifts with `singlePurchase: false`, the checkout endpoint SHALL create the Mercado Pago preference without writing any reservation state to the gift document. The gift document SHALL NOT enter the `"reserved"` status as part of an MP checkout for multi-purchase gifts.

#### Scenario: Concurrent MP checkouts on a multi-purchase gift
- **WHEN** two guests start a Mercado Pago checkout on the same multi-purchase gift within the same minute
- **THEN** both checkouts succeed, each receives its own MP preference URL, and the gift document remains `status: "available"` throughout

#### Scenario: MP checkout failure does not need rollback
- **WHEN** Mercado Pago rejects the preference-creation call for a multi-purchase gift
- **THEN** the endpoint returns an error to the caller and performs no rollback write (because no reservation was created)

### Requirement: Mercado Pago webhook is idempotent per payment for multi-purchase gifts
For multi-purchase gifts, the webhook SHALL append to `purchases[]` only when no existing entry has the same `paymentId`. Duplicate webhooks for the same payment SHALL leave the gift unchanged.

#### Scenario: Duplicate webhook does not double-record
- **WHEN** Mercado Pago retries the approval webhook for payment id `12345`
- **AND** the gift already has a `purchases[]` entry with `paymentId: "12345"`
- **THEN** no new entry is appended and the response is still acknowledged as received

### Requirement: External reference encodes buyer info for multi-purchase MP checkouts
The checkout endpoint SHALL encode the buyer info into the Mercado Pago `external_reference` field for multi-purchase gifts so the webhook can recover it on payment approval. The format SHALL be `<giftId>|<base64url(JSON({buyerType, buyerName, buyerNames}))>`. The webhook SHALL parse this format and fall back to the legacy `external_reference: "<giftId>"` parse (no `|` present) for backwards compatibility with reservations created before this change.

#### Scenario: Webhook receives the new encoded external_reference
- **WHEN** the webhook receives an approved payment with `external_reference: "abc123|eyJidXllclR5cGUi..."`
- **THEN** it splits on the first `|`, treats `abc123` as the gift id, base64url-decodes and JSON-parses the second part as the buyer info, and uses that buyer info when appending to `purchases[]`

#### Scenario: Webhook receives a legacy external_reference (no `|`)
- **WHEN** the webhook receives an approved payment with `external_reference: "abc123"` (created before this change)
- **THEN** it treats the entire string as the gift id and follows the legacy single-purchase path (set `status: "purchased"`)

#### Scenario: External_reference payload is capped to fit MP's limit
- **WHEN** a guest submits buyer info whose encoded length would push `external_reference` past 200 characters
- **THEN** the endpoint truncates `buyerNames` to the first names that fit within 200 characters total, ensuring the request to Mercado Pago succeeds

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

