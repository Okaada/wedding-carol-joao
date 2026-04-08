## Why

The photo gallery currently displays 6 placeholder SVG illustrations instead of real photos. There are 6 actual JPEG photos already in `/public/images/` (e.g., `abraco-tenda.jpeg`, `beijo-mar.jpeg`) that should be shown in the gallery. The gallery should dynamically derive its content from the actual photo filenames, replacing the hardcoded SVG placeholders with real couple photos.

## What Changes

- Replace the hardcoded SVG gallery entries in `src/data/couple.ts` with entries pointing to the real JPEG photos
- Derive meaningful Portuguese alt text from the photo filenames (e.g., `beijo-mar.jpeg` → "Beijo no mar")
- Remove unused `gallery-*.svg` placeholder files from `public/images/`
- Keep the gallery-only scope — timeline images remain unchanged

## Capabilities

### New Capabilities
- `photo-gallery-from-files`: Map real photo filenames to gallery entries with auto-derived alt text, replacing SVG placeholders

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `src/data/couple.ts` — gallery array updated with real photo paths and alt text
- `src/components/PhotoGallery.tsx` — may need minor adjustments for JPEG aspect ratios
- `public/images/gallery-*.svg` — placeholder files removed
