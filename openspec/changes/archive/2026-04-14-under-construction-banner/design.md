## Context

The site homepage renders: Navbar → Hero → Timeline → Gallery → RSVP → Footer. There's no existing banner system. The Navbar is fixed-position with z-50.

## Goals / Non-Goals

**Goals:**
- Show a friendly, non-intrusive banner at the top of the page
- Allow guests to dismiss it (persisted in sessionStorage so it stays dismissed during the visit)
- Match the site's warm aesthetic

**Non-Goals:**
- Admin toggle to show/hide the banner (just remove the component when the site is ready)
- Showing the banner on every page (homepage only is sufficient)

## Decisions

### 1. Banner placement above everything

**Decision**: Render the banner as the first element in the page, before the Navbar. Since the Navbar is `fixed`, the banner will be a static element that pushes page content down when visible.

**Rationale**: Keeps it visible without overlapping the Navbar. When dismissed, content shifts up naturally.

### 2. SessionStorage for dismiss state

**Decision**: Use `sessionStorage` to remember the dismissed state. It resets when the browser tab is closed.

**Rationale**: LocalStorage would permanently hide it — bad if the couple wants returning visitors to still see it. SessionStorage is the right middle ground: dismissed for the current visit only.

## Risks / Trade-offs

- **[Content shift on dismiss]** Dismissing the banner causes a layout shift. → Acceptable for a one-time action; the banner is small (~40px).
