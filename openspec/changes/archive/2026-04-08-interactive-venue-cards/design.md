## Context

`WeddingDayTimelineItem` is a pure server component rendering two static cards and a single shared map iframe driven by `weddingDay.mapEmbedUrl` and `weddingDay.mapUrl`. The component needs client-side interactivity to track which card is selected and swap the map accordingly. The data model must also evolve: each venue needs its own embed URL and external map link.

**Venue URLs to store:**

| Venue | embedUrl | mapUrl |
|---|---|---|
| Paróquia Santa Cruz | `https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil&output=embed` | `https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil` |
| Radaelli Eventos | `https://maps.google.com/maps?q=Radaelli+Eventos+Jardim+Buscardi&output=embed` | `https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic` |

## Goals / Non-Goals

**Goals:**
- Each venue card is clickable and visually indicates the selected state
- Clicking a card updates the map iframe and "Ver no mapa" link to that venue
- Ceremony is selected by default (map visible on first render)
- Smooth, minimal UX — no modals, no animations beyond CSS transitions

**Non-Goals:**
- Deselecting (clicking the active card to hide the map)
- Keyboard navigation or accessibility beyond basic semantics
- Any routing or URL changes

## Decisions

### 1. `useState` in `WeddingDayTimelineItem` — minimal client boundary
**Decision:** Add `"use client"` to `WeddingDayTimelineItem.tsx` and manage `selectedVenue: 'ceremony' | 'reception'` state there.

**Rationale:** The component is already the leaf that renders venue content. Making it the client boundary is the smallest possible scope — `Timeline` and everything above stays server components.

**Alternative considered:** Lifting state to `Timeline` or `page.tsx` — rejected because it would unnecessarily client-ify more of the tree.

### 2. Data model: move `embedUrl` + `mapUrl` into each venue object; remove top-level fields
**Decision:** Extend `ceremony` to `{ name, address, embedUrl, mapUrl }` and `reception` to `{ name, start, end, embedUrl, mapUrl }`. Remove top-level `mapUrl` and `mapEmbedUrl`.

**Rationale:** Each venue is self-contained. The top-level fields were a shortcut that no longer fits the per-venue model. Keeping them alongside would create confusion about which to use.

### 3. Default selection: ceremony
**Decision:** Initialize `useState` to `'ceremony'` so the map is visible on load.

**Rationale:** The ceremony is the primary event and its map is the most useful default. Guests arriving at the section immediately see the church location without needing to click.

### 4. Highlighted state: primary-colored border + tinted background
**Decision:** Selected card gets `border-primary bg-primary/5` classes; unselected cards get `border-muted/20 bg-section-alt hover:border-primary/40`.

**Rationale:** Subtle enough not to overwhelm the card content, clear enough to communicate selection. No JavaScript animations — pure Tailwind class toggling.

## Risks / Trade-offs

- **[iframe re-renders on venue switch]** → Swapping `src` on an existing iframe causes the browser to reload the map tile. This is unavoidable without pre-rendering both iframes. Mitigation: show a smooth `transition-opacity` on the iframe container; both iframes can be pre-rendered with `hidden` class to avoid reload if perf becomes an issue later.
- **[Radaelli embed accuracy]** → The embed URL uses a name-based query (`Radaelli Eventos Jardim Buscardi`). If Google doesn't resolve it precisely, the pin may be off. Mitigation: the external `mapUrl` for Radaelli uses the confirmed short link — guests can always click "Ver no mapa" to get the exact pin.
