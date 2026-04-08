## Why

The website has no section explaining where and when the wedding will take place. Guests need a clear, easy-to-find reference for the ceremony and reception logistics before they can decide to RSVP.

## What Changes

- Add a new **"O grande dia"** section to the main page with the full event schedule: date, ceremony time and venue, and reception details
- Include a **"Ver no mapa"** button linking to the provided Google Maps short URL
- Add event data (`weddingDay`) to `src/data/couple.ts` as a typed object
- Add a **"O grande dia"** anchor link to the Navbar
- **Update the wedding date** across the site from the current placeholder ("15 de Novembro de 2026") to the real date ("24 de outubro de 2026")
- Position the section after the Timeline and before the Gallery, as it is the natural next step after the couple's story

## Capabilities

### New Capabilities
- `wedding-day-info`: Section displaying ceremony date/time/venue, reception details, and a map link — all content driven from a typed data object

### Modified Capabilities
<!-- No spec-level behavior changes to existing capabilities -->

## Impact

- `src/data/types.ts` — add `WeddingDayData` type and include it in `CoupleData`
- `src/data/couple.ts` — add `weddingDay` object with real event data; update hero date to "24 de outubro de 2026"
- `src/components/WeddingDay.tsx` — new section component
- `src/app/page.tsx` — import and render `<WeddingDay />` between `<Timeline />` and `<PhotoGallery />`
- `src/components/Navbar.tsx` — add "O grande dia" anchor link
