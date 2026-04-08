## 1. Update Gallery Data

- [x] 1.1 Replace the `gallery` array in `src/data/couple.ts` with entries for the 6 real JPEG photos (`abraco-tenda.jpeg`, `beijo-mar.jpeg`, `caminhando-praia.jpeg`, `espontanea-mar.jpeg`, `pose-ponte.jpeg`, `pose-ponte-longe.jpeg`) with descriptive Portuguese alt text
- [x] 1.2 Verify that the `GalleryPhoto` type in `src/data/types.ts` still works with the updated data (no type changes expected)

## 2. Clean Up Placeholder Files

- [x] 2.1 Delete the 6 placeholder SVG files (`gallery-01.svg` through `gallery-06.svg`) from `public/images/`

## 3. Verify Gallery Rendering

- [x] 3.1 Run the dev server and confirm all 6 JPEG photos render correctly in the gallery grid
- [x] 3.2 Confirm the timeline section is unchanged and still displays its SVG images
