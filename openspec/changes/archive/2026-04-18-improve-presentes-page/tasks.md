## 1. Navbar — share across guest pages

- [x] 1.1 Update `src/components/Navbar.tsx` to read `usePathname()` and apply active styling (`text-primary`) plus `aria-current="page"` to the link whose `href` matches the current route. **Only `/presentes` is a separate route** — `Início`, `Nossa História`, `Galeria`, and `Confirmar Presença` MUST stay as anchor links (`#hero`, `#nossa-historia`, `#galeria`, `#rsvp`) and get active styling only when `pathname === "/"`. Do not convert any of them into pages.
- [x] 1.2 When on `/presentes` (or any non-home page), anchor links SHALL navigate back to the home page with the anchor (e.g. `Galeria` → `/#galeria`, `Início` → `/#hero`). Build hrefs at render time based on `pathname`; do not change the underlying anchor identity of these links.
- [x] 1.3 Mount `<Navbar />` at the top of `src/app/presentes/page.tsx` (above the existing container).
- [x] 1.4 Mount `<Navbar />` at the top of `src/app/presentes/obrigado/page.tsx`.
- [x] 1.5 Add appropriate top padding (e.g. `pt-20` or matching the home-page offset) to the `/presentes` and `/presentes/obrigado` containers so content isn't hidden behind the fixed Navbar.
- [ ] 1.6 Manual check: navigate `/` → click "Presentes" → Navbar persists, "Presentes" link is highlighted. Click "Galeria" from `/presentes` → lands on `/#galeria`.

## 2. Reusable Pagination component

- [x] 2.1 Create `src/components/Pagination.tsx` (server-friendly: takes `{ currentPage, totalPages, buildHref }` props where `buildHref(page: number) => string`).
- [x] 2.2 Render inside `<nav aria-label="Paginação">`. Render "Anterior" and "Próxima" controls; when at boundary, render as disabled `<span aria-disabled="true">` (no link).
- [x] 2.3 Implement ellipsis windowing: always show first, last, current, and ±1 around current. Insert `<span aria-hidden="true">…</span>` for collapsed gaps.
- [x] 2.4 Mark the active page link with `aria-current="page"` and a visually distinct style.
- [x] 2.5 Add a polite live region (`<p className="sr-only" aria-live="polite">Página X de Y</p>`) that updates when the page renders.
- [x] 2.6 Render compact mobile variant (`← X / Y →`) below `md:` breakpoint and full numbered range at `md:` and above.
- [x] 2.7 Return `null` when `totalPages <= 1`.

## 3. Gift list controls (filter + sort)

- [x] 3.1 Create `src/components/gifts/GiftListControls.tsx` as a client component (`"use client"`).
- [x] 3.2 Read current selections from `useSearchParams()` — never hold local state for filter/sort values.
- [x] 3.3 Render the price filter as a `<select>` with options: Todos (`all`), Até R$ 100 (`lt100`), R$ 100–300 (`100to300`), R$ 300–600 (`300to600`), Acima de R$ 600 (`gte600`).
- [x] 3.4 Render the availability toggle as a `<select>` with options: Disponíveis (`available`), Todos (`all`).
- [x] 3.5 Render the sort control as a `<select>` with options: Padrão (`default`), Menor preço (`price-asc`), Maior preço (`price-desc`).
- [x] 3.6 On any change, build a new query string preserving other params, **reset `page` to 1**, and call `router.push(newUrl, { scroll: false })`.
- [x] 3.7 Style the controls bar so it sits above the grid; collapses to a stacked column on mobile.
- [x] 3.8 Provide proper labels (`<label htmlFor>`) and visually-hidden screen-reader text where needed.

## 4. Refactor `presentes/page.tsx` to use filters, sort, pagination

- [x] 4.1 Add `searchParams` typing to the page props (`{ searchParams: Promise<Record<string, string | string[] | undefined>> }` per Next 15 conventions; `await` it).
- [x] 4.2 Define a `PAGE_SIZE = 12` constant and a parser helper that reads `page`, `sort`, `price`, `available` with safe defaults and validation (unknown values fall back to defaults).
- [x] 4.3 Build the Mongo `filter` object: always exclude `purchased`; if `available` is `available`, also restrict `status` to `"available"`. Apply price-bucket `$gte`/`$lt` based on the `price` param (values in cents: 10000, 30000, 60000).
- [x] 4.4 Build the Mongo `sort` object: `{ sortOrder: 1 }`, `{ price: 1 }`, or `{ price: -1 }`.
- [x] 4.5 Run `countDocuments(filter)` and the page slice query (`find(filter).sort(sort).skip(...).limit(PAGE_SIZE)`) in parallel via `Promise.all`.
- [x] 4.6 Compute `totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))` and clamp `currentPage` into `[1, totalPages]` (re-run the slice query if the requested page was out of range, OR pre-clamp before querying).
- [x] 4.7 Move PIX QR pre-generation loop so it iterates only over the page slice (already the case if `gifts` references the slice — confirm during refactor).
- [x] 4.8 Render `<GiftListControls />` above the grid.
- [x] 4.9 Render `<Pagination currentPage={...} totalPages={...} buildHref={(p) => buildUrl({ page: p })} />` below the grid.
- [x] 4.10 Render the empty state (`Nenhum presente encontrado com esses filtros.` + "Limpar filtros" link to `/presentes`) when `gifts.length === 0`.
- [x] 4.11 Define a `buildUrl(params: Partial<...>)` helper inside the page (or a shared util) that takes the current search params, merges overrides, drops empty/default values, and returns a clean query string. Used by `<Pagination>`'s `buildHref`.

## 5. Manual verification

- [ ] 5.1 Visit `/presentes` — Navbar is present, "Presentes" highlighted, all controls render with default selections.
- [ ] 5.2 Apply price filter "R$ 100–300" — only gifts in that bucket render, URL contains `?price=100to300`, page resets to 1.
- [ ] 5.3 Sort by "Menor preço" — gifts ordered ascending across the entire filtered set; navigating page 2 still shows ascending order.
- [ ] 5.4 With more than 12 matching gifts, pagination control appears; clicking "Próxima" navigates to `?page=2&...` with all other params preserved.
- [ ] 5.5 Out-of-range `?page=99` is clamped to the last valid page.
- [ ] 5.6 Apply filters that yield zero results — empty state shows, "Limpar filtros" returns to `/presentes`.
- [ ] 5.7 PIX-required gifts on the visible page still show their QR codes; verify nothing is generated for off-page gifts (spot check by adding a `console.time` around the loop, or by inspecting response size).
- [ ] 5.8 Visit `/presentes/obrigado` — Navbar is present.
- [ ] 5.9 Keyboard-only: Tab through pagination — disabled Previous on page 1 is skipped; active page link has visible focus and `aria-current="page"`.
- [ ] 5.10 Mobile width: Navbar mobile menu still toggles; pagination compact variant ("← 2 / 5 →") shows; controls stack vertically.

## 6. Polish

- [x] 6.1 Ensure all new user-facing strings are in pt-BR.
- [x] 6.2 No comments added beyond what's strictly non-obvious (per repo style).
- [x] 6.3 Run `npm run lint` and `npm run build`; fix any errors.
