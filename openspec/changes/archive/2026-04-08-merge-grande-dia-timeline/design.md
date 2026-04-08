## Context

The timeline (`Timeline.tsx` + `TimelineItem.tsx`) renders a vertical alternating layout with a central line on desktop. The last entry "O grande dia" is currently a plain `TimelineItem` with no image. Immediately below the timeline section, the separate `WeddingDay` component renders the same event's details again. This is redundant and breaks the story's natural end.

The `WeddingDayData` type already holds ceremony, reception, and `mapUrl`. The Google Maps short URL (`maps.app.goo.gl`) cannot be embedded as an iframe — a proper embed URL must be constructed from the address.

## Goals / Non-Goals

**Goals:**
- Make "O grande dia" the visually climactic terminal entry of the timeline — full-width, styled distinctively, showing all event details
- Embed a Google Maps iframe directly in the terminal timeline card
- Remove the standalone `WeddingDay` section and its Navbar link
- Keep the regular timeline items (`TimelineItem`) unchanged

**Non-Goals:**
- Changing the layout or visual style of the four preceding timeline items
- Adding interactivity (accordion, hover reveals, etc.)
- Google Maps API key or Places API integration

## Decisions

### 1. `WeddingDayTimelineItem` — a separate component, not a modified `TimelineItem`
**Decision:** Create a new `WeddingDayTimelineItem.tsx` component; `Timeline.tsx` renders it for the last event when `weddingDay` is provided.

**Rationale:** The terminal card is visually and semantically different enough from a regular item that sharing markup via props/conditionals inside `TimelineItem` would make both harder to maintain. A separate component keeps each clean.

**Alternative considered:** Adding `isLast` or `weddingDay` props to `TimelineItem` — rejected because it mixes concerns and complicates the existing simple component.

### 2. Timeline passes last event + weddingDay to `WeddingDayTimelineItem`
**Decision:** `Timeline.tsx` slices the events array — all but the last go to `TimelineItem`, the last event (carrying `title`, `date`, `description`) is passed alongside `weddingDay` to `WeddingDayTimelineItem`.

**Rationale:** `WeddingDayTimelineItem` needs both the narrative description (from `TimelineEvent`) and the ceremony/reception/map data (from `WeddingDayData`). Passing both keeps the data model unchanged.

### 3. Google Maps iframe via address-based embed URL — no API key
**Decision:** Add `mapEmbedUrl: string` to `WeddingDayData` and set it to `https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil&output=embed`. Store the `mapUrl` short link for the "Ver no mapa" button.

**Rationale:** The `maps.google.com?output=embed` format renders a basic interactive map without requiring an API key. The short link (`maps.app.goo.gl`) stays as the external navigation link on the button.

**Alternative considered:** Google Maps Embed API (`/maps/embed/v1/place?key=...`) — rejected because it requires a billable API key and adds infrastructure overhead.

### 4. Terminal card visual design
**Decision:** Full-width centered card with:
- A larger decorative timeline dot (filled ring)
- A top badge "O grande dia" in the primary color
- Date + time in large Playfair Display serif
- Two-column grid: Cerimônia card + Festa card
- Google Maps iframe (16:9, rounded corners, full width)
- "Ver no mapa" text link below the map

**Rationale:** Full-width breaks the alternating rhythm intentionally, signaling the end of the story. The celebratory styling distinguishes it from the four narrative items above.

## Risks / Trade-offs

- **[Maps iframe blocked by CSP]** → Next.js doesn't set a restrictive CSP by default, so the iframe should load. If a CSP is added later, `maps.google.com` must be allowlisted. No immediate mitigation needed.
- **[Maps iframe slow on mobile]** → An iframe adds weight. The map is lazy-loaded by the browser (`loading="lazy"`), which mitigates this.
- **[Address accuracy]** → The embed URL is constructed from the address string. If the address geocodes incorrectly, the map will show the wrong pin. Mitigation: verify in the browser after implementation.
