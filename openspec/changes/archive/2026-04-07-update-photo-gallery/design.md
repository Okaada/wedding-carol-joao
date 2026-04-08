## Context

The wedding website for Carol & João has a photo gallery component (`PhotoGallery.tsx`) that currently renders 6 placeholder SVG illustrations. Meanwhile, 6 real JPEG photos already exist in `/public/images/` with descriptive kebab-case filenames (e.g., `abraco-tenda.jpeg`, `beijo-mar.jpeg`). The gallery data is defined in `src/data/couple.ts` as a `GalleryPhoto[]` array with `src` and `alt` fields.

## Goals / Non-Goals

**Goals:**
- Replace placeholder SVG entries with real JPEG photo entries in the gallery data
- Derive meaningful Portuguese alt text from each photo's filename
- Clean up unused SVG placeholder files
- Ensure the gallery renders correctly with JPEG photos

**Non-Goals:**
- Modifying the timeline section or its images
- Adding dynamic file-system scanning or build-time photo discovery
- Changing the gallery layout, grid, or hover animations
- Adding lightbox, zoom, or any new gallery features

## Decisions

### 1. Static data mapping over dynamic file scanning
**Decision:** Map photo filenames to gallery entries directly in `couple.ts` rather than scanning the filesystem at build time.

**Rationale:** The current architecture uses a simple static data array. There are only 6 photos, so dynamic scanning adds unnecessary complexity. If new photos are added later, a single line in `couple.ts` is sufficient.

**Alternative considered:** Using `fs.readdirSync` in `getStaticProps` — rejected because Next.js App Router doesn't use `getStaticProps`, and the benefit is negligible for 6 images.

### 2. Filename-to-alt-text conversion
**Decision:** Manually write descriptive alt text for each photo based on its filename, rather than auto-generating from the filename string.

**Rationale:** Auto-converting `beijo-mar` to "Beijo Mar" produces poor alt text. Hand-written descriptions like "Beijo no mar" are more natural and accessible.

### 3. Keep aspect-square layout
**Decision:** Keep the existing `aspect-square` + `object-cover` styling for the gallery grid.

**Rationale:** The current layout works well with `object-cover` which will crop JPEGs to fit the square frame. No aspect ratio changes needed.

## Risks / Trade-offs

- **[Image file size]** → JPEGs are larger than SVGs but Next.js Image component handles optimization and WebP conversion automatically. No mitigation needed.
- **[Photo cropping]** → `object-cover` with `aspect-square` may crop parts of photos. Acceptable trade-off for consistent grid layout. If specific photos crop poorly, `object-position` can be added per-image later.
