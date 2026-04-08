## Why

The Cerimônia and Festa cards in "O grande dia" are static — they display info but offer no interaction. A single shared map always shows the ceremony location, leaving guests unable to see where Radaelli Eventos is without leaving the page. Making each card clickable to reveal its own map makes the section genuinely useful for guests planning their day.

## What Changes

- **BREAKING data change**: Expand `ceremony` and `reception` objects in `WeddingDayData` to each carry their own `embedUrl` (Google Maps iframe) and `mapUrl` (external link) — replacing the top-level `mapUrl` and `mapEmbedUrl` fields
- Make `WeddingDayTimelineItem` a `"use client"` component with a `selectedVenue` state (`'ceremony' | 'reception'`)
- Clicking a venue card selects it: highlighted border + background, map iframe updates to that venue's `embedUrl`, "Ver no mapa" link updates to that venue's `mapUrl`
- Default selection: ceremony (map visible on load)
- Cards have a `cursor-pointer` and a subtle hover style to signal they are interactive
- Update `src/data/couple.ts` with per-venue `embedUrl` and `mapUrl` values:
  - Cerimônia: embed from address, mapUrl = Google Maps search link
  - Radaelli Eventos: embed from venue name, mapUrl = `https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic`

## Capabilities

### New Capabilities
<!-- No net-new user-facing capability section -->

### Modified Capabilities
- `wedding-day-info`: Venue cards become interactive — clicking selects a venue, highlights the card, and swaps the map iframe to show that venue's location

## Impact

- `src/data/types.ts` — `WeddingDayData`: add `embedUrl` + `mapUrl` to `ceremony` and `reception`; remove top-level `mapUrl` and `mapEmbedUrl`
- `src/data/couple.ts` — populate new per-venue fields; remove old top-level fields
- `src/components/WeddingDayTimelineItem.tsx` — add `"use client"`, `useState`, click handlers, conditional styles, dynamic iframe src and "Ver no mapa" link
