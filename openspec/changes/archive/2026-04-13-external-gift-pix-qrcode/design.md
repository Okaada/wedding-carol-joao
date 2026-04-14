## Context

The site already has a PIX QR code generator (`src/lib/pix.ts`) used by the `PixSection` component on the presentes page. It generates a static PIX payload without an amount. The `qrcode` npm package generates QR code data URLs server-side.

External gifts now have a claim modal (`ClaimModal.tsx`) where guests provide buyer info. The couple wants this modal to also show a PIX QR code with the gift's exact price embedded, so guests can pay directly.

**Constraint**: The `qrcode` library uses Node.js canvas APIs — it can only run server-side. The claim modal is a client component. We need a way to get the QR code data URL to the client.

## Goals / Non-Goals

**Goals:**
- Show a PIX QR code with the gift's price in the claim modal for external gifts
- Reuse the existing PIX payload generator with an amount parameter
- Include a copy-to-clipboard button for the PIX payload string

**Non-Goals:**
- Verifying PIX payments (remains manual/trust-based)
- Changing the existing PixSection component at the bottom of the presentes page
- Supporting PIX for Mercado Pago-mode gifts (those already have MP checkout)

## Decisions

### 1. Pre-generate PIX data server-side and pass as props

**Decision**: Generate the PIX QR code data URL and payload string on the presentes page (server component) for each external gift, and pass them as props through `GiftCard` → `ClaimModal`.

**Rationale**: This avoids creating a new API endpoint. The presentes page already loads PIX settings from MongoDB. Generating QR codes for external gifts at page render time is simple and efficient (only a few gifts will be external).

**Alternative considered**: A `/api/pix/qrcode` endpoint that the modal fetches on open — rejected because it adds latency and complexity for a small number of QR codes.

### 2. Extend `generatePixPayload` with optional amount

**Decision**: Add an optional `amount?: number` parameter (in BRL, not cents) to `generatePixPayload`. When provided, include the amount field (TLV tag "54") in the PIX payload.

**Rationale**: The PIX spec supports an optional transaction amount in tag "54". This is a minimal change to the existing function.

### 3. Pass PIX data as optional props on GiftCard

**Decision**: Add optional `pixQrCodeUrl` and `pixPayload` props to `GiftCard`. The presentes page generates these for external gifts only and passes them down. `ClaimModal` receives them and displays the QR code section.

**Rationale**: Keeps the data flow simple — server generates, client displays. No new API calls or client-side generation needed.

## Risks / Trade-offs

- **[QR codes increase page payload]** Each QR code data URL is ~2KB base64. With 10 external gifts, that's ~20KB. → Acceptable for a wedding site with limited gifts.
- **[PIX settings must exist]** If admin hasn't configured PIX settings, external gifts won't show QR codes. → The modal still works (buyer info + claim), just without the PIX section. No error, graceful degradation.
