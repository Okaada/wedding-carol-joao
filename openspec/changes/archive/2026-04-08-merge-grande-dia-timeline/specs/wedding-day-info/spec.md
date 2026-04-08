## MODIFIED Requirements

### Requirement: Wedding day section displays ceremony details
The "O grande dia" terminal timeline card SHALL display the ceremony date, start time, venue name, and address — rendered as a card inside the timeline's last entry, not as a standalone page section.

#### Scenario: Ceremony details are visible
- **WHEN** the page is rendered
- **THEN** the terminal timeline card MUST show "24 de outubro de 2026", "16h", "Paróquia Santa Cruz", and "Rua Sinharinha Frota, 1772, Jardim Buscardi"

### Requirement: Wedding day section displays reception details
The "O grande dia" terminal timeline card SHALL display the reception venue name, start time (after ceremony), and end time — rendered as a card inside the timeline's last entry.

#### Scenario: Reception details are visible
- **WHEN** the page is rendered
- **THEN** the terminal timeline card MUST show "Radaelli Eventos", "Início após a cerimônia", and "Término às 01h00"

### Requirement: Wedding day section includes a map link
The "O grande dia" terminal timeline card SHALL include a link that opens the wedding venue location in Google Maps in a new tab.

#### Scenario: Map link opens Google Maps
- **WHEN** a user clicks the map link
- **THEN** the browser MUST navigate to the Google Maps URL (https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic) in a new tab

### Requirement: Wedding day data is driven from a typed data object
All content displayed in the "O grande dia" terminal card SHALL be sourced from the `weddingDay` field in `coupleData`, typed as `WeddingDayData`, which MUST include a `mapEmbedUrl` string for the iframe.

#### Scenario: Terminal card renders from data
- **WHEN** the `weddingDay` object is updated in `couple.ts`
- **THEN** the terminal card MUST reflect the updated content without any component code changes

## ADDED Requirements

### Requirement: Wedding day terminal card embeds a Google Maps map
The "O grande dia" terminal timeline card SHALL embed an interactive Google Maps iframe showing the ceremony venue location.

#### Scenario: Map iframe is rendered
- **WHEN** the page is rendered
- **THEN** the terminal timeline card MUST include an iframe whose `src` is the `mapEmbedUrl` from `weddingDay`, displaying the venue location

#### Scenario: Map iframe loads lazily
- **WHEN** the page loads
- **THEN** the map iframe MUST have `loading="lazy"` to defer loading until it is near the viewport

### Requirement: Wedding day info is rendered inside the timeline — not as a standalone section
The "O grande dia" content SHALL appear as the visually climactic terminal entry of the timeline (`#nossa-historia`), not as a separate `id="grande-dia"` section.

#### Scenario: No standalone grande-dia section exists
- **WHEN** the page is rendered
- **THEN** there MUST be no element with `id="grande-dia"` on the page

## REMOVED Requirements

### Requirement: Wedding day section is reachable from the Navbar
**Reason:** The standalone section is removed. Event details are now part of the timeline (`#nossa-historia`), which already has a Navbar link.
**Migration:** The Navbar "O grande dia" link is removed. Guests scroll to "Nossa História" or use the existing Navbar link.
