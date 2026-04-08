## 1. Data Model

- [x] 1.1 Add `WeddingDayData` type to `src/data/types.ts` with fields: `date` (string), `time` (string), `ceremony` (`{ name: string; address: string }`), `reception` (`{ name: string; start: string; end: string }`), and `mapUrl` (string)
- [x] 1.2 Add `weddingDay` field of type `WeddingDayData` to the `CoupleData` interface in `src/data/types.ts`
- [x] 1.3 Add the `weddingDay` object to `coupleData` in `src/data/couple.ts` with the real event data (date: "24 de outubro de 2026", time: "16h", ceremony: Paróquia Santa Cruz / Rua Sinharinha Frota 1772, reception: Radaelli Eventos / início após cerimônia / término 01h00, mapUrl: https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic)
- [x] 1.4 Update `coupleData.hero.date` in `couple.ts` from "15 de Novembro de 2026" to "24 de outubro de 2026"

## 2. Component

- [x] 2.1 Create `src/components/WeddingDay.tsx` that accepts a `WeddingDayData` prop and renders: a section heading "O grande dia", a ceremony card (date, time, venue name, address), a reception card (venue name, start, end time), and a "Ver no mapa" button linking to `mapUrl` in a new tab

## 3. Page & Navbar Integration

- [x] 3.1 Import and render `<WeddingDay data={coupleData.weddingDay} />` in `src/app/page.tsx`, positioned between `<Timeline />` and `<PhotoGallery />`, inside a `<section id="grande-dia">`
- [x] 3.2 Add `{ href: "#grande-dia", label: "O grande dia" }` to the `links` array in `src/components/Navbar.tsx`, between "Nossa História" and "Galeria"

## 4. Verify

- [x] 4.1 Run the dev server and confirm the "O grande dia" section renders all ceremony and reception details correctly
- [x] 4.2 Confirm the "Ver no mapa" button opens the Google Maps link in a new tab
- [x] 4.3 Confirm the Navbar "O grande dia" link scrolls to the section
