## 1. Data Model

- [x] 1.1 Add `mapEmbedUrl: string` field to the `WeddingDayData` interface in `src/data/types.ts`
- [x] 1.2 Add `mapEmbedUrl` to the `weddingDay` object in `src/data/couple.ts` with value `"https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil&output=embed"`
- [x] 1.3 Fix the last timeline entry date in `couple.ts` from `"15 de Novembro de 2026"` to `"24 de outubro de 2026"`

## 2. New Terminal Timeline Card Component

- [x] 2.1 Create `src/components/WeddingDayTimelineItem.tsx` that receives `event: TimelineEvent` and `weddingDay: WeddingDayData` props and renders a full-width centered card with: a large decorative timeline dot, a "O grande dia" date/time badge, the `event.description`, two side-by-side cards (Cerimônia and Festa), a Google Maps iframe using `weddingDay.mapEmbedUrl` with `loading="lazy"`, and a "Ver no mapa →" link using `weddingDay.mapUrl`

## 3. Update Timeline Component

- [x] 3.1 Update `src/components/Timeline.tsx` to accept an optional `weddingDay?: WeddingDayData` prop; import `WeddingDayTimelineItem`; slice the events array so the last event is rendered by `WeddingDayTimelineItem` (passing both the last event and `weddingDay`) and all preceding events continue to use `TimelineItem`

## 4. Page & Navbar Cleanup

- [x] 4.1 In `src/app/page.tsx`: pass `weddingDay={coupleData.weddingDay}` to `<Timeline>`; remove the `<section id="grande-dia">` block and `<WeddingDay>` import
- [x] 4.2 Remove `{ href: "#grande-dia", label: "O grande dia" }` from the `links` array in `src/components/Navbar.tsx`
- [x] 4.3 Delete `src/components/WeddingDay.tsx`

## 5. Verify

- [x] 5.1 Run the dev server and confirm the timeline ends with the special "O grande dia" card showing ceremony, reception, and the embedded Google Maps map
- [x] 5.2 Confirm no `id="grande-dia"` element exists on the page and the Navbar no longer has the "O grande dia" link
- [x] 5.3 Confirm the "Ver no mapa →" link opens Google Maps in a new tab
