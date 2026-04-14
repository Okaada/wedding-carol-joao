## ADDED Requirements

### Requirement: Gift data model includes buyer information
The `Gift` interface SHALL include fields to track buyer identity and type.

#### Scenario: Buyer fields stored on claim
- **WHEN** a gift is claimed via the claim endpoint
- **THEN** the gift document stores `buyerType` ("individual", "couple", or "group"), `buyerName` (primary name), and `buyerNames` (array of all names including primary)

#### Scenario: Buyer fields stored on Mercado Pago checkout
- **WHEN** a gift is reserved via the checkout endpoint with buyer info
- **THEN** the gift document stores the same buyer fields alongside the reservation

#### Scenario: Gift without buyer info
- **WHEN** a gift has not been claimed or purchased
- **THEN** `buyerType`, `buyerName`, and `buyerNames` are `null`

### Requirement: Admin can view buyer information
The admin gift table SHALL display who is buying each gift.

#### Scenario: Admin views gift list with buyer info
- **WHEN** an admin views the gift management page
- **THEN** the table shows a "Comprador" column displaying the buyer name(s) and type badge

#### Scenario: Admin views individual buyer
- **WHEN** a gift was claimed by an individual
- **THEN** the table shows the buyer name with an "Individual" badge

#### Scenario: Admin views couple buyer
- **WHEN** a gift was claimed by a couple
- **THEN** the table shows both names (e.g., "Ana & Pedro") with a "Casal" badge

#### Scenario: Admin views group buyer
- **WHEN** a gift was claimed by a group
- **THEN** the table shows all names (e.g., "Ana, Pedro, Maria") with a "Grupo" badge

#### Scenario: Admin views unclaimed gift
- **WHEN** a gift has no buyer info
- **THEN** the table shows "—" in the buyer column

### Requirement: Admin can view and edit buyer info on gift detail
The admin gift edit page SHALL display and allow editing of buyer information.

#### Scenario: Admin edits buyer info
- **WHEN** an admin opens the edit page for a claimed/purchased gift
- **THEN** the form shows buyer type, primary name, and additional names fields
- **AND** the admin can update or correct the buyer information

### Requirement: Claimed status in admin status badge
The admin status badge component SHALL support the `"claimed"` status.

#### Scenario: Claimed status badge display
- **WHEN** a gift has status `"claimed"`
- **THEN** the badge displays "Reservado" with a distinct color (blue)

### Requirement: Admin gift stats include claimed count
The admin dashboard stats SHALL include claimed gifts in the count.

#### Scenario: Stats show claimed gifts
- **WHEN** the admin views the gift dashboard
- **THEN** the stats show total, available, reserved, claimed, and purchased counts
