## ADDED Requirements

### Requirement: Manual panic mode toggle
The admin settings page SHALL include a toggle to manually enable or disable PIX fallback panic mode.

#### Scenario: Admin enables panic mode
- **WHEN** the admin clicks the panic mode toggle to "on"
- **THEN** the `settings` collection stores `{ key: "panic_mode", value: { enabled: true, enabledAt: <timestamp> } }`
- **AND** the settings page shows status "Ativado manualmente"

#### Scenario: Admin disables panic mode
- **WHEN** the admin clicks the panic mode toggle to "off"
- **THEN** the `settings` collection stores `{ key: "panic_mode", value: { enabled: false, enabledAt: null } }`
- **AND** the settings page shows status "Desativado"

### Requirement: Mercado Pago errors are logged to database
The checkout endpoint SHALL log each Mercado Pago failure to the `mp_errors` collection.

#### Scenario: Mercado Pago preference creation fails
- **WHEN** the checkout endpoint fails to create a Mercado Pago preference
- **THEN** a document `{ giftId, error, createdAt }` is inserted into the `mp_errors` collection
- **AND** the existing rollback and 500 response behavior is preserved

### Requirement: Automatic panic mode activation on 3+ errors per day
The system SHALL automatically activate PIX fallback when 3 or more Mercado Pago errors are recorded in the current day (UTC).

#### Scenario: Third MP error triggers auto panic mode
- **WHEN** the presentes page loads
- **AND** the `mp_errors` collection contains 3+ documents with `createdAt` on the current day
- **THEN** panic mode is considered active (even if manual toggle is off)
- **AND** all mercadopago gifts display PIX fallback behavior

#### Scenario: Fewer than 3 errors, manual mode off
- **WHEN** the presentes page loads
- **AND** the `mp_errors` collection contains fewer than 3 errors today
- **AND** manual panic mode is disabled
- **THEN** mercadopago gifts use normal Mercado Pago checkout

### Requirement: PIX fallback for mercadopago gifts in panic mode
When panic mode is active, mercadopago gifts SHALL display PIX QR codes in the claim modal instead of redirecting to Mercado Pago.

#### Scenario: Guest clicks Presentear on mercadopago gift during panic mode
- **WHEN** panic mode is active (manual or auto)
- **AND** a guest clicks "Presentear" on a gift with `purchaseMode: "mercadopago"`
- **THEN** the claim modal opens with a PIX QR code for the gift amount
- **AND** on confirmation, the gift is claimed via `/api/gifts/[id]/claim` (not checkout)

#### Scenario: Panic mode inactive, normal flow
- **WHEN** panic mode is NOT active
- **AND** a guest clicks "Presentear" on a gift with `purchaseMode: "mercadopago"`
- **THEN** the normal Mercado Pago checkout flow is used

### Requirement: Admin visibility of panic mode status and error count
The admin settings page SHALL display the current panic mode status and today's MP error count.

#### Scenario: Admin views panic mode status
- **WHEN** the admin opens the settings page
- **THEN** the page shows:
  - Manual toggle state (on/off)
  - Today's MP error count
  - Overall status: "Desativado" / "Ativado manualmente" / "Ativado automaticamente (X erros hoje)"

### Requirement: PIX data generated for all gifts in panic mode
The presentes page SHALL generate PIX QR code data for all priced gifts (not just external) when panic mode is active.

#### Scenario: Panic mode active, PIX data for all gifts
- **WHEN** the presentes page loads with panic mode active
- **AND** PIX settings are configured
- **THEN** PIX QR code data URLs and payloads are generated for every gift with `price > 0`
- **AND** each `GiftCard` receives `pixQrCodeUrl`, `pixPayload`, and `panicMode: true` props
