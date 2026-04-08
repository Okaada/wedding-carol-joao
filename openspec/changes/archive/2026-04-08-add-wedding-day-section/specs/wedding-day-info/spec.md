## ADDED Requirements

### Requirement: Wedding day section displays ceremony details
The "O grande dia" section SHALL display the ceremony date, start time, venue name, and address.

#### Scenario: Ceremony details are visible
- **WHEN** the page is rendered
- **THEN** the section MUST show "24 de outubro de 2026", "16h", "Paróquia Santa Cruz", and "Rua Sinharinha Frota, 1772, Jardim Buscardi"

### Requirement: Wedding day section displays reception details
The "O grande dia" section SHALL display the reception venue name, start time (after ceremony), and end time.

#### Scenario: Reception details are visible
- **WHEN** the page is rendered
- **THEN** the section MUST show "Radaelli Eventos", "Início após a cerimônia", and "Término às 01h00"

### Requirement: Wedding day section includes a map link
The "O grande dia" section SHALL include a link that opens the wedding venue location in Google Maps.

#### Scenario: Map link opens Google Maps
- **WHEN** a user clicks the map link
- **THEN** the browser MUST navigate to the Google Maps URL (https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic) in a new tab

### Requirement: Wedding day section is reachable from the Navbar
The Navbar SHALL include an anchor link labeled "O grande dia" that scrolls to the wedding day section.

#### Scenario: Navbar link scrolls to section
- **WHEN** a user clicks "O grande dia" in the Navbar
- **THEN** the page MUST scroll to the section with `id="grande-dia"`

### Requirement: Wedding day data is driven from a typed data object
All content displayed in the "O grande dia" section SHALL be sourced from a `weddingDay` field in `coupleData`, typed as `WeddingDayData`.

#### Scenario: Section renders from data
- **WHEN** the `weddingDay` object is updated in `couple.ts`
- **THEN** the section MUST reflect the updated content without any component code changes
