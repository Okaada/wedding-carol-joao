## Why

Having "O grande dia" as both the final timeline entry and a separate section below it creates visual redundancy and breaks the narrative flow. Merging the event details into the timeline's last entry makes the page feel like a single cohesive story — culminating naturally in the wedding day — and eliminates the need to scroll past duplicate content.

## What Changes

- **Remove** the standalone `<section id="grande-dia">` and `<WeddingDay>` component from `page.tsx`
- **Remove** the "O grande dia" link from the Navbar
- **Delete** `src/components/WeddingDay.tsx` (no longer needed)
- **Transform** the last `TimelineItem` ("O grande dia") into a visually special, full-width terminal card that displays: date, time, ceremony card, reception card, and an embedded Google Maps iframe
- **Add** `mapEmbedUrl` field to `WeddingDayData` in `types.ts` and `couple.ts` — a pre-constructed Google Maps embed URL for the iframe
- **Fix** the last timeline entry date from "15 de Novembro de 2026" to "24 de outubro de 2026"
- **Create** `src/components/WeddingDayTimelineItem.tsx` — the special terminal timeline card
- **Update** `Timeline.tsx` to accept `weddingDay` and render the last event as `WeddingDayTimelineItem`

## Capabilities

### New Capabilities
<!-- No net-new user-facing capability; this is a UX consolidation -->

### Modified Capabilities
- `wedding-day-info`: Presentation changes from a standalone section to an embedded terminal entry inside the timeline, with the addition of a Google Maps iframe embed

## Impact

- `src/data/types.ts` — add `mapEmbedUrl: string` to `WeddingDayData`
- `src/data/couple.ts` — add `mapEmbedUrl`, fix last timeline date
- `src/components/Timeline.tsx` — accept optional `weddingDay` prop; render last event via `WeddingDayTimelineItem`
- `src/components/WeddingDayTimelineItem.tsx` — new special terminal card component
- `src/components/WeddingDay.tsx` — deleted
- `src/app/page.tsx` — remove `<WeddingDay>` section, remove import
- `src/components/Navbar.tsx` — remove "O grande dia" link
