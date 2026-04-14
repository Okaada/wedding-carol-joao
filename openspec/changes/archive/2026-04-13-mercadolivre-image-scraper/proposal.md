## Why

When admins register gifts with a Mercado Livre URL, they currently must manually find and paste an image URL separately. This is tedious and error-prone. By automatically extracting the product image from the Mercado Livre listing, we eliminate a manual step and ensure gifts always have a high-quality product image.

## What Changes

- When a gift is created or updated with an `externalUrl` pointing to Mercado Livre (`mercadolivre.com.br` or `mercadolibre.com`), the system automatically fetches the first product image from that listing.
- The extracted image URL is used as the gift's `imageUrl` if no custom image URL is provided.
- Admins can still override the image by manually entering an `imageUrl`.

## Capabilities

### New Capabilities
- `mercadolivre-image-extraction`: Server-side extraction of the primary product image from a Mercado Livre product URL. Used during gift creation and update to auto-populate the image.

### Modified Capabilities

## Impact

- **Code**: `src/app/actions/admin-gifts.ts` (createGift/updateGift actions), potentially a new utility in `src/lib/`.
- **Dependencies**: May need a server-side HTML fetch (native `fetch`) or Mercado Livre API usage to extract image metadata.
- **APIs**: No public API changes. This is an internal admin-side enhancement.
- **Systems**: Outbound HTTP requests from the server to Mercado Livre during gift save operations.
