## Why

The `/presentes` page is currently a poor browsing experience: the site Navbar is missing (guests lose navigation context after entering the page), and the gift list is a flat single grid with no way to narrow down or order items. As the catalog grows, guests have to scroll through every card to find a gift that fits their budget, which both reduces conversions and makes the page feel cluttered.

## What Changes

- Render the shared site `Navbar` on `/presentes` (and on `/presentes/obrigado`) so guests keep consistent navigation across the site. Update `Navbar` so the "Presentes" link is highlighted as active when on `/presentes`.
- Add a **filter** above the gift grid — minimally a price-range filter (e.g., "Até R$ 100", "R$ 100–300", "R$ 300–600", "Acima de R$ 600", "Todos") and an availability toggle ("Disponíveis" vs "Todos") so guests can quickly narrow the list.
- Add a **sort by price** control (Menor preço, Maior preço, Padrão/curadoria) that defaults to the current `sortOrder` curation.
- Add **pagination** that only activates when filtered results exceed a page-size threshold (default 12 per page). Pagination follows current best practices: URL-driven query state (`?page=`, `?sort=`, `?filter=`) so pages are shareable and bookmarkable, accessible `<nav aria-label="Paginação">` controls with Previous / Next / numbered pages, ellipsis for long ranges, disabled state at boundaries, and announces page changes for screen readers. Filter/sort changes reset to page 1.
- Preserve current behavior: PIX QR-code pre-generation for external/panic-mode gifts must continue to work (only generated for the gifts visible on the current page to keep the page light).

## Capabilities

### New Capabilities
- `gift-list-browsing`: filter, sort, and paginate the public gift catalog on `/presentes`, with URL-driven state and accessible pagination controls.
- `site-navigation`: shared site-wide Navbar applied to all guest-facing pages (including `/presentes`) with active-link highlighting based on the current route.

### Modified Capabilities
<!-- None — existing gift-claim-flow / gift-pix-checkout / pix-fallback-mode behavior is preserved unchanged; only the listing surface changes. -->

## Impact

- **Code**: `src/app/presentes/page.tsx` (server component — moves data fetching to accept search params), new client `src/components/gifts/GiftListControls.tsx` (filter + sort UI), new `src/components/Pagination.tsx` (reusable, accessible). `src/components/Navbar.tsx` gains active-link awareness via `usePathname`. `src/app/presentes/obrigado/page.tsx` adds `<Navbar />`.
- **APIs**: No new HTTP endpoints required — filtering/sorting/pagination is done in the server component against MongoDB (`find().sort().skip().limit()` with a count for total pages). Existing `/api/gifts/[id]/claim` and `/checkout` endpoints are untouched.
- **Dependencies**: None added. Pagination + controls are built with existing React + Tailwind.
- **SEO/perf**: PIX QR pre-generation now scoped to the current page slice (cheaper renders). URL query params keep deep links working.
- **UX**: Empty-state copy needed when filters yield zero results.
