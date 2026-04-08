## Context

The wedding website currently has no section dedicated to event logistics. Guests who land on the page have no way to see when and where the wedding takes place without scrolling past the hero. The real event details are:

- **Data:** 24 de outubro de 2026, 16h
- **Cerimônia:** Paróquia Santa Cruz — Rua Sinharinha Frota, 1772, Jardim Buscardi
- **Festa:** Radaelli Eventos — início após a cerimônia, término às 01h00
- **Mapa:** https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic

The existing `couple.ts` hero date ("15 de Novembro de 2026") is placeholder data and must be updated to the real date.

## Goals / Non-Goals

**Goals:**
- Display ceremony and reception details in a visually distinct section
- Link to Google Maps via the provided short URL
- Store all event data in a typed `weddingDay` object in `couple.ts`
- Update the hero date to match the real date
- Add a Navbar anchor link

**Non-Goals:**
- Google Maps iframe embed (requires API key; a link button is sufficient)
- Countdown timer or dynamic date calculations
- Separate pages or routes for event details

## Decisions

### 1. Static typed data in `couple.ts` — not hardcoded in the component
**Decision:** Store all event content in a new `WeddingDayData` type added to `src/data/types.ts` and a `weddingDay` field in `coupleData`.

**Rationale:** Consistent with how Hero, Timeline, and Gallery data are handled. Easy to update content without touching JSX.

### 2. Google Maps link button — not an iframe embed
**Decision:** Use an `<a href target="_blank">` button with the provided Google Maps short URL.

**Rationale:** Iframe embeds of short Google Maps URLs don't work — they require a full embed URL generated via the Maps Embed API (which needs a billable API key). A link button is simpler, works universally, and is better on mobile.

### 3. Two-card layout: Cerimônia + Festa
**Decision:** Render the section as two visually separated cards (or columns) — one for ceremony details, one for reception — under a single "O grande dia" heading.

**Rationale:** Makes it immediately scannable. Guests can quickly see ceremony vs. reception info at a glance. The map link appears below both cards as it applies to both venues (or the main venue).

### 4. Section positioned between Timeline and Gallery
**Decision:** Place `<WeddingDay />` between `<Timeline />` and `<PhotoGallery />` in `page.tsx`.

**Rationale:** Natural narrative flow — story of the couple (Timeline) → the big day details → photos → RSVP.

## Risks / Trade-offs

- **[Google Maps short URL longevity]** → Short URLs depend on Google's redirect service. Unlikely to break, but the full address is stored in `couple.ts` as a fallback label. No mitigation needed.
- **[Hero date mismatch]** → Updating the hero date from "15 de Novembro de 2026" to "24 de outubro de 2026" also affects the footer (which renders `coupleData.hero.date`). Both will be updated together.
