## ADDED Requirements

### Requirement: PIX payload supports transaction amount
The `generatePixPayload` function SHALL accept an optional `amount` parameter (in BRL) and include it as TLV tag "54" in the PIX payload when provided.

#### Scenario: PIX payload with amount
- **WHEN** `generatePixPayload` is called with `amount: 159.90`
- **THEN** the generated payload includes tag "54" with value "159.90"
- **AND** the QR code encodes the full amount for the recipient

#### Scenario: PIX payload without amount (backwards compatible)
- **WHEN** `generatePixPayload` is called without an amount
- **THEN** the payload is generated without tag "54" (same as current behavior)

### Requirement: External gifts display PIX QR code in claim modal
The claim modal for external gifts SHALL display a PIX QR code when PIX settings are configured.

#### Scenario: Guest opens claim modal for external gift with PIX configured
- **WHEN** a guest clicks "Presentear" on an external gift
- **AND** PIX settings are configured in the admin panel
- **THEN** the claim modal shows a PIX QR code encoding the gift's price
- **AND** the QR code is displayed above the buyer info form

#### Scenario: Guest opens claim modal without PIX configured
- **WHEN** a guest clicks "Presentear" on an external gift
- **AND** PIX settings are NOT configured
- **THEN** the claim modal shows only the buyer info form (no QR code section)

### Requirement: Copy PIX code button in claim modal
The claim modal SHALL include a button to copy the PIX payload string to the clipboard.

#### Scenario: Guest copies PIX code
- **WHEN** the PIX QR code is displayed in the claim modal
- **THEN** a "Copiar código PIX" button is shown below the QR code
- **AND** clicking it copies the PIX payload to the clipboard
- **AND** the button text changes to "Copiado!" briefly

### Requirement: PIX data is pre-generated server-side
The presentes page SHALL pre-generate PIX QR code data URLs and payload strings for external gifts and pass them as props.

#### Scenario: Server generates PIX data for external gifts
- **WHEN** the presentes page loads
- **AND** PIX settings are configured
- **THEN** for each gift with `purchaseMode: "external"` and `price > 0`, the server generates a PIX QR code data URL and payload string
- **AND** passes them to the corresponding `GiftCard` component as props

#### Scenario: Mercado Pago gifts don't get PIX data
- **WHEN** the presentes page loads
- **THEN** gifts with `purchaseMode: "mercadopago"` do NOT receive PIX QR code props
