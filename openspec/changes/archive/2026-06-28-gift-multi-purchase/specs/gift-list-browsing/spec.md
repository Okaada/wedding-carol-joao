## MODIFIED Requirements

### Requirement: Filter gifts by availability
The `/presentes` page SHALL provide an availability toggle with values `Disponíveis` (default) and `Todos`. The selection SHALL be encoded as `?available=available|all`.

When `?available=available`, the server SHALL include every gift that is currently buyable: any gift with `singlePurchase: false` (or the field absent) regardless of past purchases, OR any gift with `singlePurchase: true` and `status: "available"`. It SHALL exclude single-purchase gifts whose `status` is `"reserved"`, `"claimed"`, or `"purchased"`.

When `?available=all`, the server SHALL include all gifts except those with `status: "purchased"`. Multi-purchase gifts SHALL never be `status: "purchased"` at the gift-document level, so this toggle effectively shows them all alongside any reserved/claimed single-purchase gifts (which still render with the locked-card UI).

#### Scenario: Default availability includes multi-purchase gifts even after prior purchases
- **WHEN** a guest visits `/presentes` without an `available` query param
- **AND** the collection contains a multi-purchase gift whose `purchases[]` already has entries
- **THEN** that gift appears in the grid as an available "Presentear" card

#### Scenario: Default availability hides locked single-purchase gifts
- **WHEN** a guest visits `/presentes` without an `available` query param
- **AND** a single-purchase gift has `status: "claimed"` or `status: "reserved"`
- **THEN** that gift is NOT included in the grid

#### Scenario: "Todos" shows locked single-purchase gifts with their reserved/claimed UI
- **WHEN** a guest selects "Todos" in the availability toggle
- **AND** a single-purchase gift has `status: "reserved"` or `status: "claimed"`
- **THEN** that gift renders in the grid with the existing locked "Presente reservado" / "Presente sendo pago" UI
- **AND** multi-purchase gifts also render (always as available)
