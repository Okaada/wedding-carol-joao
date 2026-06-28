## MODIFIED Requirements

### Requirement: Gift data model includes buyer information
The `Gift` interface SHALL track buyer identity for every successful purchase. For `singlePurchase: true` gifts, the gift document SHALL continue to store the legacy single-buyer fields (`buyerType`, `buyerName`, `buyerNames`) on the gift document itself. For `singlePurchase: false` gifts, buyer information SHALL live as entries inside the gift's `purchases[]` array (one entry per claim or approved payment). The legacy single-buyer fields MAY also be populated on multi-purchase gifts (mirroring the most recent buyer), but the `purchases[]` array is the source of truth.

#### Scenario: Buyer fields stored on claim for single-purchase gift
- **WHEN** a gift with `singlePurchase: true` is claimed via the claim endpoint
- **THEN** the gift document stores `buyerType`, `buyerName`, and `buyerNames` on the top-level document (legacy behavior)
- **AND** a corresponding entry is also appended to `purchases[]`

#### Scenario: Buyer fields stored on Mercado Pago checkout for single-purchase gift
- **WHEN** a gift with `singlePurchase: true` is reserved via the checkout endpoint with buyer info
- **THEN** the gift document stores the buyer fields on the top-level document alongside the reservation (legacy behavior)

#### Scenario: Multi-purchase claim appends to purchases[]
- **WHEN** a gift with `singlePurchase: false` is claimed
- **THEN** a new entry with `source: "claim"`, `paymentId: null`, and the buyer info is appended to `purchases[]`
- **AND** no top-level `status` change occurs

#### Scenario: Multi-purchase MP approval appends to purchases[]
- **WHEN** the MP webhook approves a payment for a gift with `singlePurchase: false`
- **THEN** a new entry with `source: "mercadopago"`, the MP `paymentId`, and the buyer info recovered from `external_reference` is appended to `purchases[]`
- **AND** no top-level `status` change occurs

#### Scenario: Gift without buyer info
- **WHEN** a gift has not been claimed or purchased
- **THEN** `purchases` is `[]` (the legacy top-level `buyerType`/`buyerName`/`buyerNames` are `null` for `singlePurchase: true` gifts)

### Requirement: Admin can view buyer information
The admin gift table SHALL display the buyer(s) of each gift. For `singlePurchase: true` gifts, the column SHALL render the legacy single-buyer summary (name(s) + type badge). For `singlePurchase: false` gifts, the column SHALL summarize `purchases[]`: render a buyer count plus the names of the first few buyers (e.g., "Ana, Pedro +3 outros" when there are 5 entries). When `purchases.length === 0` on a multi-purchase gift, the column SHALL render "—".

#### Scenario: Admin views unclaimed gift
- **WHEN** a gift has `purchases.length === 0` and no legacy top-level buyer info
- **THEN** the table shows "—" in the buyer column

#### Scenario: Admin views single-purchase gift claimed by an individual
- **WHEN** a single-purchase gift was claimed by an individual
- **THEN** the table shows the buyer name with an "Individual" badge (legacy rendering)

#### Scenario: Admin views single-purchase gift claimed by a couple
- **WHEN** a single-purchase gift was claimed by a couple
- **THEN** the table shows both names (e.g., "Ana & Pedro") with a "Casal" badge (legacy rendering)

#### Scenario: Admin views single-purchase gift claimed by a group
- **WHEN** a single-purchase gift was claimed by a group
- **THEN** the table shows all names (e.g., "Ana, Pedro, Maria") with a "Grupo" badge (legacy rendering)

#### Scenario: Admin views multi-purchase gift with multiple buyers
- **WHEN** a multi-purchase gift has 5 entries in `purchases[]` (first two: "Ana", "Pedro")
- **THEN** the table shows a buyer count (e.g., "5 compradores") and a preview such as "Ana, Pedro +3 outros"

#### Scenario: Admin views multi-purchase gift with a single buyer so far
- **WHEN** a multi-purchase gift has exactly one entry in `purchases[]` for "Ana"
- **THEN** the table shows "1 comprador" and renders "Ana"

### Requirement: Admin can view and edit buyer info on gift detail
The admin gift edit page SHALL display and allow editing of buyer information. For `singlePurchase: true` gifts, the existing editable fields (buyer type, primary name, additional names) SHALL remain. For `singlePurchase: false` gifts, the edit page SHALL render the `purchases[]` list as a read-only summary in this change; in-place editing of individual entries is out of scope here.

#### Scenario: Admin edits buyer info on single-purchase gift
- **WHEN** an admin opens the edit page for a claimed/purchased single-purchase gift
- **THEN** the form shows buyer type, primary name, and additional names fields
- **AND** the admin can update or correct the buyer information

#### Scenario: Admin views purchases history on multi-purchase gift
- **WHEN** an admin opens the edit page for a multi-purchase gift with entries in `purchases[]`
- **THEN** the page renders the list of purchases (buyer name(s), type, source, timestamp) as read-only

### Requirement: Admin gift stats include claimed count
The admin dashboard stats SHALL include claimed gifts in the count. The "Comprados" stat SHALL include both legacy `status === "purchased"` gifts and the total number of entries summed across every gift's `purchases[]` array, so multi-purchase contributions are reflected in the dashboard total.

#### Scenario: Stats show legacy single-purchase counts
- **WHEN** the admin views the gift dashboard and the collection contains only single-purchase gifts
- **THEN** the stats show total, available, reserved, claimed, and purchased counts (legacy rendering)

#### Scenario: Multi-purchase entries are counted in "Comprados"
- **WHEN** the collection contains 2 single-purchase gifts with `status: "purchased"` and 3 multi-purchase gifts whose `purchases[]` arrays contain 4, 1, and 2 entries respectively
- **THEN** the "Comprados" stat displays 9 (2 legacy purchased + 4 + 1 + 2 = 9)
