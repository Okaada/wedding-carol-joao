## ADDED Requirements

### Requirement: Guest can claim a gift via external purchase flow
The system SHALL allow guests to claim a gift without going through Mercado Pago payment. When a gift has `purchaseMode: "external"`, the "Presentear" button SHALL open a claim modal instead of initiating a checkout.

#### Scenario: Guest claims a gift with external link
- **WHEN** a guest clicks "Presentear" on a gift with `purchaseMode: "external"`
- **THEN** the system displays a modal collecting buyer name, buyer type (individual/couple/group), and optional additional names
- **AND** the modal shows the Mercado Livre link (if present) so the guest knows where to buy

#### Scenario: Guest submits the claim form
- **WHEN** the guest fills in their name, selects buyer type, and clicks "Confirmar"
- **THEN** the system calls `POST /api/gifts/[id]/claim` with buyer info
- **AND** the gift status changes to `"claimed"`
- **AND** the gift card updates to show "Presente reservado" state

#### Scenario: Gift is already claimed by someone else
- **WHEN** the guest submits a claim for a gift that is no longer available
- **THEN** the system displays an error message "Este presente já foi reservado"
- **AND** the modal remains open so the guest can close it

### Requirement: Buyer info modal for Mercado Pago gifts
The system SHALL show a buyer info modal before redirecting to Mercado Pago checkout for gifts with `purchaseMode: "mercadopago"`.

#### Scenario: Guest provides buyer info before Mercado Pago checkout
- **WHEN** a guest clicks "Presentear" on a gift with `purchaseMode: "mercadopago"`
- **THEN** the system displays the buyer info modal (name, type, additional names)
- **AND** after submission, the system sends buyer info with the checkout request
- **AND** the guest is redirected to Mercado Pago as before

### Requirement: Buyer type selection with dynamic name fields
The claim modal SHALL adapt its name fields based on the selected buyer type.

#### Scenario: Individual buyer
- **WHEN** the guest selects "Sozinho(a)" as buyer type
- **THEN** only a single name field is shown

#### Scenario: Couple buyer
- **WHEN** the guest selects "Casal" as buyer type
- **THEN** two name fields are shown (one pre-filled from the primary name)

#### Scenario: Group buyer
- **WHEN** the guest selects "Grupo" as buyer type
- **THEN** a dynamic list of name fields is shown with an "Adicionar nome" button to add more

### Requirement: Gift purchase mode configuration
The system SHALL support a `purchaseMode` field on gifts to determine the checkout behavior.

#### Scenario: Admin creates a gift with external purchase mode
- **WHEN** an admin creates a gift and selects purchase mode "Compra externa"
- **THEN** the gift is saved with `purchaseMode: "external"`
- **AND** guests see the claim modal flow (not Mercado Pago checkout)

#### Scenario: Admin creates a gift with Mercado Pago purchase mode
- **WHEN** an admin creates a gift and selects purchase mode "Mercado Pago"
- **THEN** the gift is saved with `purchaseMode: "mercadopago"`
- **AND** guests see the buyer info modal followed by Mercado Pago redirect

#### Scenario: Default purchase mode for new gifts
- **WHEN** an admin creates a gift without selecting a purchase mode
- **THEN** the gift defaults to `purchaseMode: "mercadopago"`

### Requirement: Image-only gifts without external link
The system SHALL allow gifts that have only an image and description, without requiring an external URL or a price for Mercado Pago.

#### Scenario: Gift with image but no external link
- **WHEN** a gift has `purchaseMode: "external"` and no `externalUrl`
- **THEN** the gift card displays the image and description
- **AND** the "Presentear" button opens the claim modal normally
- **AND** no "Comprar no MercadoLivre" link is shown

### Requirement: Claimed gift status display
The system SHALL display claimed gifts with a distinct visual state.

#### Scenario: Gift card shows claimed state
- **WHEN** a gift has status `"claimed"`
- **THEN** the gift card displays "Presente reservado" (same as other non-available states)
- **AND** the "Presentear" button is not shown
