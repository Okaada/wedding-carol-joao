## MODIFIED Requirements

### Requirement: Guest can claim a gift via external purchase flow
The system SHALL allow guests to claim a gift without going through Mercado Pago payment. When a gift has `purchaseMode: "external"`, the "Presentear" button SHALL open a claim modal instead of initiating a checkout. The endpoint SHALL append the buyer info to the gift's `purchases[]` array on every successful claim. For gifts with `singlePurchase: true`, the endpoint SHALL also flip `status` to `"claimed"` (legacy behavior). For gifts with `singlePurchase: false`, the endpoint SHALL leave `status` as `"available"` so additional guests can claim the same gift later.

#### Scenario: Guest claims a gift with external link (multi-purchase, default)
- **WHEN** a guest clicks "Presentear" on a multi-purchase gift with `purchaseMode: "external"`
- **THEN** the system displays the claim modal with buyer name, type, and additional names
- **AND** the modal shows the Mercado Livre link (if present)

#### Scenario: Guest submits the claim form on a multi-purchase gift
- **WHEN** the guest submits the claim form for a multi-purchase gift
- **THEN** the system calls `POST /api/gifts/[id]/claim` with buyer info
- **AND** a new entry is appended to `purchases[]` with `source: "claim"`, `paymentId: null`, and the buyer info
- **AND** the gift status stays `"available"`
- **AND** the card UI still shows the "Presentear" button so other guests can claim it

#### Scenario: Guest submits the claim form on a single-purchase gift
- **WHEN** the guest submits the claim form for a gift with `singlePurchase: true`
- **THEN** the gift status changes to `"claimed"` (legacy behavior)
- **AND** a `purchases[]` entry is also appended for that buyer
- **AND** the gift card updates to show "Presente reservado" state

#### Scenario: Single-purchase gift is already claimed by someone else
- **WHEN** the guest submits a claim for a single-purchase gift that is no longer available
- **THEN** the system displays an error message "Este presente já foi reservado"
- **AND** the modal remains open so the guest can close it

### Requirement: Claimed gift status display
The system SHALL display claimed gifts with a distinct visual state, but only for `singlePurchase: true` gifts. Multi-purchase gifts SHALL continue to render the "Presentear" CTA regardless of prior `purchases[]` entries.

#### Scenario: Single-purchase gift card shows claimed state
- **WHEN** a gift has `singlePurchase: true` and `status: "claimed"`
- **THEN** the gift card displays "Presente reservado" (same as other non-available states)
- **AND** the "Presentear" button is not shown

#### Scenario: Multi-purchase gift card stays open after a claim
- **WHEN** a gift has `singlePurchase: false` and at least one entry in `purchases[]`
- **THEN** the gift card still displays the "Presentear" button
- **AND** no "Presente reservado" / "Presente sendo pago" overlay is rendered
