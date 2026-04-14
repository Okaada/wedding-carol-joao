## Why

The current gift registry only supports Mercado Pago checkout — guests pay through the platform and the couple receives money. But many gifts are physical items the couple wants guests to buy directly (e.g., on Mercado Livre). The couple needs a way to list gifts with external purchase links without requiring payment through the site. Additionally, there's no way to track who is giving each gift or whether it's from a single person, a couple, or a group — making thank-you notes and gift tracking difficult.

## What Changes

- **Mercado Livre reference links**: Gifts can optionally include a Mercado Livre (or any external) link as a purchase reference. Guests click the link, buy externally, then mark the gift as "taken" on the site.
- **Gift claim flow ("Presentear" without payment)**: For gifts with external links (no Mercado Pago checkout), the "Presentear" button opens a modal where the guest registers their name, indicates if they're buying solo, as a couple, or as a group, and confirms. The gift is then marked as claimed.
- **Buyer registration**: Every gift (whether claimed via external link or paid via Mercado Pago) records who is buying it: the buyer's name(s) and whether it's an individual, couple, or group.
- **Image-only gifts**: Some gifts don't need an external link — they can just have an image and description. The claim flow still works the same way.
- **Admin visibility**: The admin panel shows who claimed/purchased each gift, the buyer type, and buyer names.

## Capabilities

### New Capabilities
- `gift-claim-flow`: Guest-facing modal flow for claiming a gift — collects buyer name(s), buyer type (individual/couple/group), and marks the gift as claimed without payment.
- `gift-buyer-tracking`: Data model and admin UI for tracking who is buying each gift, their type (individual/couple/group), and their names.

### Modified Capabilities
<!-- No existing spec-level capabilities are being modified -->

## Impact

- **Data model**: `Gift` interface gains new fields: `buyerName`, `buyerType` (individual/couple/group), `buyerNames` (array for groups). The `externalUrl` field is already present but becomes more prominent.
- **API**: New `POST /api/gifts/[id]/claim` endpoint (replaces the unused legacy one) to handle claims with buyer info. The existing checkout endpoint should also capture buyer info.
- **Components**: `GiftCard.tsx` needs a claim modal. `GiftTable.tsx` and admin edit form need buyer info columns/fields.
- **Database**: MongoDB `gifts` collection gains buyer-related fields. No migration needed (schemaless).
