## Context

The wedding gift registry allows admins to add gifts with an `externalUrl` (typically a Mercado Livre product link) and a separate `imageUrl`. Currently, admins must manually find and copy the product image URL from Mercado Livre, which is tedious. Mercado Livre product pages include Open Graph meta tags (`og:image`) that contain the primary product image URL, making it straightforward to extract.

## Goals / Non-Goals

**Goals:**
- Automatically extract the first product image from a Mercado Livre URL when creating/updating a gift
- Use the extracted image only when no manual `imageUrl` is provided
- Keep the implementation simple and server-side only

**Non-Goals:**
- Scraping multiple images or product details (title, price, description)
- Caching scraped images locally or in a CDN
- Supporting other e-commerce sites beyond Mercado Livre
- Real-time image sync if the Mercado Livre listing changes

## Decisions

### 1. Extract image via Open Graph `og:image` meta tag

**Choice**: Fetch the HTML of the Mercado Livre product page server-side and parse the `og:image` meta tag.

**Alternatives considered**:
- **Mercado Livre API**: Requires API credentials, OAuth setup, and rate limit management. Overkill for extracting a single image.
- **Puppeteer/headless browser**: Heavy dependency for a simple meta tag extraction. Mercado Livre renders `og:image` in the initial HTML response.

**Rationale**: `og:image` is present in the static HTML response, requires no authentication, and is the standard way product images are exposed for link previews. A simple `fetch` + regex/string parse is sufficient.

### 2. Extract at save time in server actions

**Choice**: Run the extraction inside `createGift` and `updateGift` server actions, before writing to the database.

**Alternatives considered**:
- **Client-side extraction on URL input blur**: Would require CORS proxy or API route, adds latency to the form UX.
- **Background job**: Unnecessary complexity for a single HTTP request.

**Rationale**: Server actions already handle the gift save flow. Adding the fetch there keeps the logic colocated and avoids new infrastructure.

### 3. Only fill imageUrl when empty

**Choice**: Only use the scraped image when `imageUrl` is not provided by the admin. If the admin provides an explicit image URL, it takes priority.

**Rationale**: Respects manual overrides. The scraped image is a convenience default, not a forced value.

## Risks / Trade-offs

- **[Mercado Livre changes HTML structure]** → The `og:image` meta tag is a web standard for social previews and unlikely to be removed. If it changes, the extraction simply returns null and the gift saves without an image — no breakage.
- **[Slow or failed fetch]** → Network issues when fetching the ML page could slow gift creation. Mitigation: set a short timeout (5s) and treat failure as non-fatal (gift saves without auto-image).
- **[Image URL expiration]** → Mercado Livre image CDN URLs are typically stable, but could theoretically expire. Mitigation: out of scope for now; admin can manually update the image URL if needed.
