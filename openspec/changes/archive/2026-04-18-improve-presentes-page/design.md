## Context

`/presentes` is a Next.js App Router server component (`src/app/presentes/page.tsx`) that loads every non-purchased gift from MongoDB, sorts by `sortOrder` ascending, and renders a 3-column grid of `<GiftCard>`s. PIX QR codes are pre-generated server-side for external/panic-mode gifts. The shared `<Navbar>` (used on the home page) is **not** mounted on `/presentes`, so guests only see a small "Voltar ao site" link. There is no filter, no sort UI, and no pagination — every available gift is sent on every request. The page is `force-dynamic`.

## Goals / Non-Goals

**Goals:**
- Restore consistent site navigation across `/presentes` and `/presentes/obrigado` by mounting the shared `<Navbar>`.
- Let guests narrow the gift list by **price range** and **availability**, and reorder by **price (asc/desc)** or curation default.
- Paginate the result set with shareable, accessible, URL-driven controls when the filtered list exceeds the page size.
- Keep PIX QR generation correct and **only** generate codes for gifts on the current page (avoid wasted CPU/memory).
- Preserve all existing claim / checkout / panic-mode behavior.

**Non-Goals:**
- No new admin features for managing categories or tags (price-range buckets are derived, not stored).
- No client-side data fetching / SWR — the page stays a server component to keep PIX pre-generation server-side.
- No infinite scroll. Numbered pagination is preferred for accessibility, deep-linking, and predictable pagination semantics.
- No full-text search (out of scope; can be a follow-up).
- No changes to the gift schema or to the claim/checkout APIs.

## Decisions

### 1. Server component + `searchParams` (vs. client-side filtering)
**Choice:** Keep `presentes/page.tsx` as a server component that reads `searchParams` (`page`, `sort`, `price`, `available`) and queries MongoDB with the appropriate `find/sort/skip/limit`.

**Why:** Server-side filtering keeps the rendered HTML small, lets PIX QR generation stay server-side and scoped to just the page slice, and makes URLs naturally shareable. A client-side filter would force us to ship every gift to the browser and either move QR generation to the client or generate codes that may never be used.

**Alternatives considered:**
- *Client-side filter on a single fetch* — rejected: bloats payload, breaks server-rendered PIX, can't paginate cleanly.
- *Dedicated `/api/gifts` listing endpoint with SWR* — rejected: extra surface area, loses server PIX, and unnecessary for a small catalog.

### 2. Pagination model — offset/page-number (vs. cursor)
**Choice:** Use offset pagination via `?page=N` with a fixed `PAGE_SIZE = 12`. Compute `totalCount` with `countDocuments(filter)` in parallel with the slice query.

**Why:** The catalog is bounded (tens of items, not millions), guests benefit from "page 3 of 5" affordances and jumping to arbitrary pages, and offset pagination plays naturally with sort-by-price. Cursor pagination would prevent direct page jumps and complicate UX with no real perf gain at this scale.

**Trade-off:** Offset pagination can produce duplicate/missed items if the underlying set changes between page loads. Acceptable here — gift availability changes are rare and the result is at worst a stale card, not data loss.

### 3. Pagination UI — best-practice component
**Choice:** Build a reusable `<Pagination>` component with:
- `<nav aria-label="Paginação">` wrapper.
- "Anterior" / "Próxima" buttons with disabled state at boundaries (rendered as `<span aria-disabled="true">` so they're focus-skippable but visually present).
- Numbered page links with **ellipsis windowing** (always show first, last, current, and ±1 around current; collapse the rest with `…`).
- `aria-current="page"` on the active number.
- Live region (`aria-live="polite"`) announcing "Página X de Y" after navigation.
- Each control is a real `<Link>` (Next.js `<Link>`) preserving the other query params (`sort`, `price`, `available`) so deep links survive.
- Hidden on mobile if total pages ≤ 1; shows compact "← X / Y →" on small screens, full numbered range on `md:` and up.

**Why:** Matches WAI-ARIA Authoring Practices for pagination, keeps state in the URL (refresh-safe, shareable, back-button friendly), and degrades gracefully without JS because each page is a real `<a href>`.

### 4. Filter & sort UI — simple, URL-bound
**Choice:** A small `<GiftListControls>` client component above the grid. Each select/toggle updates the URL via `router.push(...)` with `scroll: false`. No local component state — the URL is the source of truth (read via `useSearchParams`).

**Filters:**
- **Price** (`?price=`): `all` (default), `lt100`, `100to300`, `300to600`, `gte600`. Applied as a Mongo `$gte`/`$lt` on `price` (cents).
- **Availability** (`?available=`): `available` (default — current behavior, hides `purchased`/`reserved`/`claimed`) or `all` (only excludes `purchased`).

**Sort** (`?sort=`):
- `default` (sortOrder asc — current behavior),
- `price-asc`,
- `price-desc`.

Changing a filter or sort resets `page` to 1.

**Why selects, not chips/sliders:** Lower implementation cost, fully accessible by default, easy to localize, and the small number of buckets is fine for a wedding gift list. Sliders need debouncing, ARIA work, and feel like overkill for ~5 buckets.

### 5. PIX QR generation — page-scoped
**Choice:** Move the PIX pre-generation loop to run only over the gifts in the current page slice (post-filter, post-sort, post-pagination). The current code already loops `for (const gift of gifts)` — after pagination, `gifts` is already the slice, so the loop is naturally scoped without changes to the inner logic.

**Why:** Generating QR codes for unseen gifts wastes CPU and grows the response. With page size 12, we generate at most 12 QR codes per render.

### 6. Navbar active link
**Choice:** Update `Navbar.tsx` to read `usePathname()`. For each link, if it's a route (`/presentes`) and `pathname === href`, add `text-primary` styling and `aria-current="page"`. Anchor links (`#hero`, etc.) only get active styling on the home page.

**Why:** Tells the guest where they are, completes the navigation contract, and is one line of logic per link.

### 7. Empty state
**Choice:** When the filter yields zero results, render a centered message: *"Nenhum presente encontrado com esses filtros."* with a "Limpar filtros" button that links back to `/presentes`.

## Risks / Trade-offs

- **[Risk] URL state desync between SSR and client controls** → **Mitigation:** controls component reads `useSearchParams()` on every render; never holds shadow state. The `key` prop on the controls includes the searchParams string, so unmounting if needed is trivial.
- **[Risk] Offset pagination yields stale-by-one snapshots if a gift is reserved between requests** → **Mitigation:** acceptable; if a guest lands on a reserved card it just renders the "Presente reservado" state (existing behavior). No data loss.
- **[Risk] Adding `<Navbar>` covers the page top** → **Mitigation:** already a fixed nav; add `pt-20` (or matching) padding to the `/presentes` container, mirroring how the home page handles overlap. Verify both `/presentes` and `/presentes/obrigado`.
- **[Risk] `force-dynamic` already in place — pagination/filter changes still trigger full server renders** → **Mitigation:** acceptable; the page is small and filter changes are infrequent. Re-evaluate caching only if traffic warrants.
- **[Risk] Bot crawlers paginate forever** → **Mitigation:** clamp `page` to `[1, totalPages]` server-side and `404` (or redirect to last page) if out of range. Add `<link rel="canonical">` on filtered pages pointing at the unfiltered list to avoid SEO duplication. (Lower priority — wedding site, not heavily crawled.)

## Migration Plan

Single-PR rollout, no data migration needed:
1. Land Navbar active-link change + mount it on `/presentes` and `/presentes/obrigado`.
2. Land `<Pagination>` and `<GiftListControls>` components.
3. Refactor `presentes/page.tsx` to read `searchParams`, build the Mongo filter, paginate, render controls + grid + pagination.
4. Manually verify: filter combos, sort directions, page links preserve query params, PIX QR still renders for external gifts on the current page, empty state copy, mobile menu still works, `/presentes/obrigado` shows navbar.

Rollback: revert the PR — no DB or API changes to undo.

## Open Questions

- Should the price-range buckets be tunable from admin, or is the hardcoded set in `proposal.md` fine for v1? (Default: hardcoded — revisit only if catalog price distribution shifts.)
- Default sort: keep `sortOrder` (curation) or switch to `price-asc`? (Default: keep curation — preserves the couple's intentional ordering.)
- Page size 12 vs 9 vs 15? (Default: 12 — fits neatly in the 3-column desktop grid as 4 rows.)
