## 1. Image Extraction Utility

- [x] 1.1 Create `src/lib/mercadolivre.ts` with a function `extractMercadoLivreImage(url: string): Promise<string | null>` that fetches the page HTML, parses the `og:image` meta tag, and returns the image URL (or null on failure)
- [x] 1.2 Add Mercado Livre domain detection helper: return true for URLs matching `mercadolivre.com.br` or `mercadolibre.com`
- [x] 1.3 Set fetch timeout to 5 seconds using `AbortController`

## 2. Integrate into Gift Server Actions

- [x] 2.1 In `createGift` (`src/app/actions/admin-gifts.ts`), call the extraction function when `externalUrl` is a Mercado Livre URL and `imageUrl` is empty, then set the extracted image as `imageUrl`
- [x] 2.2 In `updateGift`, apply the same logic: extract image when `externalUrl` is a Mercado Livre URL and `imageUrl` is empty

## 3. Testing

- [x] 3.1 Manually test gift creation with a real Mercado Livre URL and no image — verify the image is auto-populated
- [x] 3.2 Test gift creation with a Mercado Livre URL and a manual image — verify the manual image is preserved
- [x] 3.3 Test gift creation with a non-Mercado Livre URL — verify no extraction is attempted
- [x] 3.4 Test timeout behavior by verifying the gift saves even if the fetch is slow/fails
