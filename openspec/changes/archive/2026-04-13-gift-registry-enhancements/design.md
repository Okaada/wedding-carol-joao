## Context

The wedding gift registry currently only supports a Mercado Pago payment flow: guests click "Presentear", get redirected to Mercado Pago, pay, and the gift is marked as purchased via webhook. There's a legacy `/api/gifts/[id]/claim` endpoint that accepts a `guestName` but it's unused by the frontend.

The couple wants to support gifts that are purchased externally (e.g., on Mercado Livre) — guests should be able to claim the gift without paying through the site. Additionally, the couple wants to know who is giving each gift and whether it's an individual, couple, or group.

**Current state:**
- `Gift` interface has `claimedBy`/`claimedAt` fields (unused legacy)
- `externalUrl` field exists but only renders a "Comprar no MercadoLivre" link
- No buyer info is captured during checkout or claim flows
- Admin table shows payment ID but no buyer info

## Goals / Non-Goals

**Goals:**
- Allow gifts to be claimed without Mercado Pago payment (external purchase flow)
- Capture buyer information (name, type: individual/couple/group, additional names for couples/groups)
- Show buyer info in the admin panel
- Support gifts with just an image (no external link, no price/payment)

**Non-Goals:**
- Automated verification that an external purchase was actually made
- Changing the existing Mercado Pago payment flow mechanics
- Group payment splitting or partial payments
- Notification system (email/WhatsApp) when a gift is claimed

## Decisions

### 1. Repurpose the existing `/api/gifts/[id]/claim` endpoint

**Decision**: Rewrite the existing claim endpoint to accept buyer info and handle the "external purchase" flow.

**Rationale**: The endpoint already exists with the right URL pattern and basic structure. The current `claimedBy`/`claimedAt` fields align with this use case. No need to create a new endpoint.

**Alternative considered**: Creating a separate `/api/gifts/[id]/reserve-external` endpoint — rejected because it fragments the claim concept unnecessarily.

### 2. Add buyer info fields to the Gift data model

**Decision**: Add these fields to the `Gift` interface:
```typescript
buyerType: "individual" | "couple" | "group" | null;
buyerName: string | null;       // Primary buyer name
buyerNames: string[] | null;    // Additional names for couples/groups
```

**Rationale**: `buyerName` is the primary contact. `buyerNames` stores additional names when `buyerType` is "couple" or "group". This keeps the model flat and queryable.

**Alternative considered**: A single `buyers: Array<{name: string}>` — rejected because it adds nesting complexity for the common case (individual buyer).

### 3. Claim modal on the frontend instead of a separate page

**Decision**: When a guest clicks "Presentear" on a gift without Mercado Pago checkout (or with only an external link), show a modal to collect buyer info before claiming.

**Rationale**: A modal keeps the guest on the gift list page, reducing navigation friction. The form is simple (name, type, optional additional names) so a full page is overkill.

### 4. Two-path "Presentear" button logic

**Decision**: The "Presentear" button behavior depends on gift configuration:
- **Gift has a price and no external-only flag**: Goes to Mercado Pago checkout (current flow), but first shows the buyer info modal.
- **Gift has external URL only (or is image-only)**: Shows buyer info modal, then calls the claim endpoint directly.

**Rationale**: The couple wants both flows to capture buyer info. The modal appears in both cases, but the post-modal action differs.

**Implementation detail**: Add a `purchaseMode` field to Gift: `"mercadopago"` (default, current behavior) or `"external"` (claim without payment). This is cleaner than inferring behavior from the presence/absence of `externalUrl` and `price`.

### 5. Status for externally claimed gifts

**Decision**: Use status `"claimed"` (new value) for gifts that are claimed via the external flow, distinct from `"reserved"` (Mercado Pago in-progress) and `"purchased"` (Mercado Pago confirmed).

**Rationale**: The couple needs to distinguish between "someone said they'll buy this externally" vs "payment confirmed through Mercado Pago". Using a distinct status makes admin filtering clear.

**Update to status type**: `"available" | "reserved" | "purchased" | "claimed"`

### 6. Buyer info capture for Mercado Pago flow

**Decision**: Show the buyer info modal before redirecting to Mercado Pago checkout. Send buyer info with the checkout request body. The checkout endpoint saves it alongside the reservation.

**Rationale**: Mercado Pago doesn't reliably pass back custom payer data in webhooks. Capturing it upfront during reservation is the simplest reliable approach.

## Risks / Trade-offs

- **[Trust-based claims]** External claims rely on guests being honest — there's no payment verification. → Acceptable for a wedding context; admin can manually revert claims if needed.
- **[Status complexity]** Adding a 4th status ("claimed") increases status logic across the app. → Mitigated by clear badge colors and keeping the status badge component centralized.
- **[Modal UX on mobile]** Modals can be awkward on mobile. → Use a responsive bottom-sheet style on small screens or a simple full-width modal with proper scrolling.
- **[Buyer info optional for Mercado Pago]** If a guest skips the modal (e.g., direct API call), buyer info won't be captured. → Acceptable edge case; the payment ID still links to Mercado Pago payer info.
