## ADDED Requirements

### Requirement: Shared site Navbar on guest pages
Every guest-facing page (the home page, `/presentes`, and `/presentes/obrigado`) SHALL render the shared `<Navbar />` component at the top, providing consistent navigation across the site. Admin routes are excluded.

#### Scenario: Navbar present on the gifts page
- **WHEN** a guest navigates to `/presentes`
- **THEN** the shared `<Navbar />` is rendered fixed to the top of the viewport with the same links it shows on the home page

#### Scenario: Navbar present on the thank-you page
- **WHEN** a guest lands on `/presentes/obrigado` after a successful gift purchase
- **THEN** the shared `<Navbar />` is rendered, allowing the guest to navigate back to any other section

#### Scenario: Navbar absent on admin routes
- **WHEN** an admin user visits any `/admin/*` route
- **THEN** the guest `<Navbar />` is NOT rendered (admin uses its own `AdminShell` chrome)

### Requirement: Active link indication
The shared `<Navbar />` SHALL highlight the link whose `href` corresponds to the current route, and SHALL set `aria-current="page"` on that link. The only Navbar entry that is a separate route is `Presentes` (`/presentes`); all other entries — `Início` (`#hero`), `Nossa História` (`#nossa-historia`), `Galeria` (`#galeria`), and `Confirmar Presença` (`#rsvp`) — are anchor links into the home page and MUST NOT be converted into routes. Active styling for anchor entries applies only when the guest is on the home page.

#### Scenario: Highlight the Presentes link on the gifts page
- **WHEN** a guest is on `/presentes`
- **THEN** the "Presentes" link in the Navbar is rendered with the active-style class (e.g. `text-primary`) and `aria-current="page"`

#### Scenario: Anchor links inactive on non-home pages
- **WHEN** a guest is on `/presentes`
- **THEN** anchor-only links such as "Início", "Nossa História", "Galeria", and "Confirmar Presença" are NOT styled active and clicking them navigates to `/#hero`, `/#nossa-historia`, etc. (i.e., back to the home page with the anchor)

### Requirement: Guest content offset for fixed Navbar
Pages that mount the shared Navbar SHALL apply enough top padding so that page content is not hidden behind the fixed Navbar bar.

#### Scenario: Gifts page content is not occluded
- **WHEN** a guest scrolls to the top of `/presentes`
- **THEN** the page heading "Lista de Presentes" is fully visible below the Navbar (not clipped behind it)
