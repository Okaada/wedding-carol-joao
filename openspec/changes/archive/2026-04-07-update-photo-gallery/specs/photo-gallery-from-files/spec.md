## ADDED Requirements

### Requirement: Gallery displays real photos from file names
The gallery SHALL display entries derived from the actual JPEG photo files present in `/public/images/`. Each gallery entry MUST reference a real `.jpeg` file with a descriptive Portuguese alt text derived from its filename.

#### Scenario: All real photos appear in the gallery
- **WHEN** the photo gallery section is rendered
- **THEN** the gallery MUST display exactly the following photos: `abraco-tenda.jpeg`, `beijo-mar.jpeg`, `caminhando-praia.jpeg`, `espontanea-mar.jpeg`, `pose-ponte.jpeg`, `pose-ponte-longe.jpeg`

#### Scenario: Each photo has meaningful alt text
- **WHEN** a gallery photo is rendered
- **THEN** its `alt` attribute MUST contain a descriptive phrase in Portuguese (pt-BR) that reflects the content suggested by the filename (e.g., `beijo-mar.jpeg` → "Beijo no mar")

### Requirement: Gallery does not use placeholder SVGs
The gallery data SHALL NOT reference any `gallery-*.svg` placeholder files.

#### Scenario: No SVG placeholders in gallery entries
- **WHEN** the gallery data array is loaded
- **THEN** no entry SHALL have a `src` value matching the pattern `gallery-*.svg`

### Requirement: Placeholder SVG files are removed
The unused `gallery-*.svg` placeholder files SHALL be removed from `public/images/`.

#### Scenario: Gallery SVG files deleted from public directory
- **WHEN** the change is applied
- **THEN** the files `gallery-01.svg` through `gallery-06.svg` SHALL no longer exist in `/public/images/`

### Requirement: Timeline images remain unchanged
The timeline section SHALL NOT be affected by this change. Timeline images (`timeline-*.svg`) and their data MUST remain as-is.

#### Scenario: Timeline data is untouched
- **WHEN** the photo gallery change is applied
- **THEN** the `timeline` array in `couple.ts` SHALL remain identical to its pre-change state
