## 1. PIX Payload with Amount

- [x] 1.1 Update `generatePixPayload` in `src/lib/pix.ts` to accept optional `amount?: number` param and include TLV tag "54" when provided
- [x] 1.2 Update `generatePixQrCodeDataUrl` to pass through the amount parameter

## 2. Server-Side PIX Data Generation

- [x] 2.1 Update `src/app/presentes/page.tsx` to generate PIX QR code data URLs and payload strings for each external gift with price > 0
- [x] 2.2 Pass `pixQrCodeUrl` and `pixPayload` props to `GiftCard` for external gifts

## 3. GiftCard and ClaimModal Props

- [x] 3.1 Add optional `pixQrCodeUrl` and `pixPayload` props to `GiftCard` component and forward to `ClaimModal`
- [x] 3.2 Add optional `pixQrCodeUrl` and `pixPayload` props to `ClaimModal` component

## 4. PIX QR Code Display in Modal

- [x] 4.1 Add PIX QR code image and info section to `ClaimModal` (displayed above buyer form when props are present)
- [x] 4.2 Add "Copiar código PIX" button using the existing `CopyPixButton` pattern (or inline clipboard logic)

## 5. Verification

- [x] 5.1 Build the project and verify no TypeScript errors
- [x] 5.2 Verify the PIX section appears in claim modal for external gifts with price
