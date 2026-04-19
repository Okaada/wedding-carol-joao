## ADDED Requirements

### Requirement: Filter gifts by price range
The `/presentes` page SHALL provide a price-range filter control with the buckets `Todos` (default), `Até R$ 100`, `R$ 100–300`, `R$ 300–600`, `Acima de R$ 600`. The selected filter SHALL be encoded in the URL as `?price=<bucket>` and applied server-side to the MongoDB query.

#### Scenario: Guest selects a price bucket
- **WHEN** a guest selects "R$ 100–300" from the price filter
- **THEN** the URL updates to include `?price=100to300` and the grid re-renders showing only gifts whose `price` (in BRL cents) satisfies `>= 10000` and `< 30000`

#### Scenario: Default state shows every gift bucket
- **WHEN** a guest visits `/presentes` without a `price` query param
- **THEN** the price filter displays "Todos" and no price constraint is applied

#### Scenario: Filter change resets pagination
- **WHEN** a guest is on `?page=3` and changes the price filter
- **THEN** the URL is updated with the new `price` value and `page` is reset to 1

### Requirement: Filter gifts by availability
The `/presentes` page SHALL provide an availability toggle with values `Disponíveis` (default — excludes `purchased`, `reserved`, `claimed`) and `Todos` (only excludes `purchased`). The selection SHALL be encoded as `?available=available|all`.

#### Scenario: Default availability hides claimed/reserved
- **WHEN** a guest visits `/presentes` without an `available` query param
- **THEN** only gifts with `status === "available"` appear in the grid

#### Scenario: "Todos" shows reserved and claimed gifts as locked cards
- **WHEN** a guest selects "Todos" in the availability toggle
- **THEN** reserved/claimed gifts also render but with the existing locked "Presente reservado" / "Presente sendo pago" UI

### Requirement: Sort gifts by price or curation
The `/presentes` page SHALL provide a sort control with options `Padrão` (default, by `sortOrder` ascending), `Menor preço` (by `price` ascending), and `Maior preço` (by `price` descending). The selected sort SHALL be encoded as `?sort=default|price-asc|price-desc`.

#### Scenario: Sort by ascending price
- **WHEN** a guest selects "Menor preço"
- **THEN** the URL updates to `?sort=price-asc` and gifts render ordered by `price` ascending across the entire filtered result set (not just the current page)

#### Scenario: Default sort preserves curation
- **WHEN** no `sort` param is present
- **THEN** gifts render in `sortOrder` ascending order, matching the previous behavior of the page

### Requirement: Paginate gift results
When the number of gifts matching the active filters exceeds the page size (12), the page SHALL paginate results and expose `?page=N` in the URL. Each rendered page SHALL include only its own slice of gifts (server-side `skip`/`limit`).

#### Scenario: Catalog within a single page
- **WHEN** the filtered result set contains 12 or fewer gifts
- **THEN** all gifts render on page 1 and no pagination control is shown

#### Scenario: Catalog spans multiple pages
- **WHEN** the filtered result set contains more than 12 gifts
- **THEN** the first 12 render on page 1 and a pagination control appears below the grid showing the total page count

#### Scenario: Out-of-range page number is clamped
- **WHEN** a guest requests `?page=99` and only 3 pages exist
- **THEN** the server clamps the request to the last valid page (`page=3`) and renders that page's slice

#### Scenario: Page query updates preserve other filters
- **WHEN** a guest navigates from `?price=100to300&sort=price-asc&page=1` to page 2 via the pagination control
- **THEN** the resulting URL is `?price=100to300&sort=price-asc&page=2` (all params preserved)

### Requirement: Accessible pagination controls
The pagination component SHALL meet baseline accessibility expectations: it SHALL render inside `<nav aria-label="Paginação">`, mark the active page with `aria-current="page"`, render Previous/Next controls with disabled state at boundaries, collapse long page ranges with an ellipsis (always showing first, last, current, and ±1 around current), and announce page changes via a polite live region.

#### Scenario: Active page is announced to assistive tech
- **WHEN** the guest is on page 2 of 5
- **THEN** the link/element representing page 2 has `aria-current="page"` set

#### Scenario: First page disables Previous
- **WHEN** the guest is on page 1
- **THEN** the "Anterior" control is rendered in a disabled, non-focusable state

#### Scenario: Long ranges collapse with ellipsis
- **WHEN** there are 10 total pages and the guest is on page 5
- **THEN** the control shows `1 … 4 5 6 … 10` (first, last, current, ±1 around current, ellipses for the gaps)

### Requirement: Empty filter state
When the active filter combination yields zero gifts, the page SHALL render a centered empty-state message in Portuguese with a "Limpar filtros" link that navigates to `/presentes` with no query parameters.

#### Scenario: Filter yields no matches
- **WHEN** a guest applies filters that exclude every gift
- **THEN** the grid is replaced by the message "Nenhum presente encontrado com esses filtros." and a "Limpar filtros" link pointing to `/presentes`

### Requirement: PIX QR codes scoped to the visible page
PIX QR-code pre-generation for external-mode gifts (and all gifts under panic mode) SHALL only run for gifts present on the currently rendered page slice — never for gifts excluded by the filter or living on other pages.

#### Scenario: Page slice limits QR generation
- **WHEN** the catalog has 30 external-mode gifts and the guest is on page 1 (12 gifts shown)
- **THEN** at most 12 PIX QR codes are generated for that request, not 30
