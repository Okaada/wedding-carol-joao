## MODIFIED Requirements

### Requirement: External gifts display PIX QR code in claim modal
The claim modal for external gifts SHALL display a PIX QR code when PIX settings are configured in the server environment.

#### Scenario: Guest opens claim modal for external gift with PIX configured
- **WHEN** a guest clicks "Presentear" on an external gift
- **AND** all four `PIX_*` environment variables are set
- **THEN** the claim modal shows a PIX QR code encoding the gift's price
- **AND** the QR code is displayed above the buyer info form

#### Scenario: Guest opens claim modal without PIX configured
- **WHEN** a guest clicks "Presentear" on an external gift
- **AND** one or more `PIX_*` environment variables is unset
- **THEN** the claim modal shows only the buyer info form (no QR code section)

### Requirement: PIX data is pre-generated server-side
The presentes page SHALL pre-generate PIX QR code data URLs and payload strings for external gifts, sourcing PIX settings from the server environment, and pass them as props.

#### Scenario: Server generates PIX data for external gifts
- **WHEN** the presentes page loads
- **AND** PIX settings are configured in the server environment
- **THEN** for each gift with `purchaseMode: "external"` and `price > 0`, the server generates a PIX QR code data URL and payload string
- **AND** passes them to the corresponding `GiftCard` component as props
