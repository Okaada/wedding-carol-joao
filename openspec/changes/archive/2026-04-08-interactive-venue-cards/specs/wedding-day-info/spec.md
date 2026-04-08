## ADDED Requirements

### Requirement: Venue cards are selectable and show their own map
Clicking a venue card (Cerimônia or Festa) SHALL select it, highlight it visually, and update the map iframe and "Ver no mapa" link to show that venue's location.

#### Scenario: Clicking Cerimônia card selects it
- **WHEN** a user clicks the Cerimônia card
- **THEN** the Cerimônia card MUST appear highlighted (primary border and tinted background) and the map iframe MUST display the ceremony venue location

#### Scenario: Clicking Festa card selects it
- **WHEN** a user clicks the Festa card
- **THEN** the Festa card MUST appear highlighted and the map iframe MUST display the Radaelli Eventos location

#### Scenario: Only one card is selected at a time
- **WHEN** a user clicks one venue card
- **THEN** the other card MUST appear in its unselected state (no highlight)

#### Scenario: Ceremony is selected by default
- **WHEN** the page first renders
- **THEN** the Cerimônia card MUST be selected and the ceremony map MUST be visible without any user interaction

### Requirement: "Ver no mapa" link reflects the selected venue
The "Ver no mapa" external link SHALL point to the map URL of whichever venue card is currently selected.

#### Scenario: Ver no mapa link changes with selection
- **WHEN** a user selects the Festa card
- **THEN** the "Ver no mapa" link MUST open `https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic` in a new tab

#### Scenario: Ceremony Ver no mapa link
- **WHEN** a user selects the Cerimônia card
- **THEN** the "Ver no mapa" link MUST open the ceremony's Google Maps URL in a new tab

### Requirement: Venue cards signal interactivity
Venue cards SHALL have a pointer cursor and a subtle hover style to indicate they are clickable.

#### Scenario: Cards show pointer cursor on hover
- **WHEN** a user hovers over a venue card
- **THEN** the cursor MUST change to a pointer and the card border MUST subtly change color

## MODIFIED Requirements

### Requirement: Wedding day data is driven from a typed data object
All content displayed in the "O grande dia" terminal card SHALL be sourced from the `weddingDay` field in `coupleData`, typed as `WeddingDayData`. The `ceremony` object MUST include `embedUrl` and `mapUrl`; the `reception` object MUST include `embedUrl` and `mapUrl`. The top-level `mapUrl` and `mapEmbedUrl` fields are removed.

#### Scenario: Terminal card renders from data
- **WHEN** the `weddingDay` object is updated in `couple.ts`
- **THEN** the terminal card MUST reflect the updated content without any component code changes
