## 1. Data Model

- [x] 1.1 In `src/data/types.ts`, extend `ceremony` to `{ name: string; address: string; embedUrl: string; mapUrl: string }` and `reception` to `{ name: string; start: string; end: string; embedUrl: string; mapUrl: string }`; remove top-level `mapUrl` and `mapEmbedUrl` from `WeddingDayData`
- [x] 1.2 In `src/data/couple.ts`, add to `ceremony`: `embedUrl: "https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil&output=embed"` and `mapUrl: "https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil"`
- [x] 1.3 In `src/data/couple.ts`, add to `reception`: `embedUrl: "https://maps.google.com/maps?q=Radaelli+Eventos+Jardim+Buscardi&output=embed"` and `mapUrl: "https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic"`; remove top-level `mapUrl` and `mapEmbedUrl`

## 2. Interactive Component

- [x] 2.1 Add `"use client"` to `src/components/WeddingDayTimelineItem.tsx` and import `useState` from React
- [x] 2.2 Add `const [selected, setSelected] = useState<'ceremony' | 'reception'>('ceremony')` state
- [x] 2.3 Make the Cerimônia card a `<button>` (or `<div role="button">`) that calls `setSelected('ceremony')` on click; apply highlighted classes (`border-primary bg-primary/5 cursor-pointer`) when `selected === 'ceremony'`, unselected classes (`border-muted/20 bg-section-alt hover:border-primary/40 cursor-pointer`) otherwise
- [x] 2.4 Make the Festa card a `<button>` (or `<div role="button">`) that calls `setSelected('reception')` on click; apply the same conditional classes based on `selected === 'reception'`
- [x] 2.5 Replace the hardcoded `iframe src` with `selected === 'ceremony' ? weddingDay.ceremony.embedUrl : weddingDay.reception.embedUrl`
- [x] 2.6 Replace the hardcoded "Ver no mapa" `href` with `selected === 'ceremony' ? weddingDay.ceremony.mapUrl : weddingDay.reception.mapUrl`

## 3. Verify

- [x] 3.1 On load, confirm the Cerimônia card is highlighted and the ceremony map is displayed
- [x] 3.2 Click the Festa card — confirm it becomes highlighted, Cerimônia becomes unselected, and the map switches to Radaelli Eventos
- [x] 3.3 Confirm the "Ver no mapa" link updates correctly for each selected venue
