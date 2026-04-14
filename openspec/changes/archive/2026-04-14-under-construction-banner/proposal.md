## Why

The wedding site is still being built. Guests may visit early and see incomplete features or placeholder content. A small, friendly banner at the top of the page lets them know the site is a work in progress, so they don't worry about missing info.

## What Changes

- **Construction banner**: A dismissible top banner on the homepage with a friendly message in Portuguese (e.g., "Nosso site ainda está sendo preparado com carinho!"). Uses the site's warm color palette, appears above the navbar, and can be closed by the guest.

## Capabilities

### New Capabilities
- `construction-banner`: A dismissible "under construction" banner displayed at the top of the site.

### Modified Capabilities
<!-- None -->

## Impact

- **`src/app/page.tsx`**: Adds the banner component before the Navbar.
- **New component**: `src/components/ConstructionBanner.tsx` — small client component with dismiss state.
- No database, API, or dependency changes.
