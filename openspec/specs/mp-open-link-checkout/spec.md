# mp-open-link-checkout Specification

## Purpose
Captures buyer intent server-side and redirects the guest to the couple's shared Mercado Pago open payment link (manual amount entry), reconciled by the admin via `/admin/pending-payments`. This replaced the earlier Preference-API-based checkout to remove all Mercado Pago API/token/webhook surface area.

## Requirements

### Requirement: Shared payment link URL stored in settings
The `settings` collection SHALL store the shared Mercado Pago open payment link URL under `key: "mercadopago_payment_link"` with `value: { url: string, updatedAt: string }`. The admin settings page SHALL render an input field that reads and writes this value. When the document is missing, the system SHALL fall back to the default URL `https://link.mercadopago.com.br/presentecarolejoao`.

#### Scenario: Admin sets payment link
- **WHEN** the admin saves a non-empty URL in the "Link de pagamento Mercado Pago" field
- **THEN** the `settings` document `{ key: "mercadopago_payment_link" }` is upserted with `value: { url, updatedAt: <iso> }`
- **AND** the admin settings page reflects the new value on reload

#### Scenario: Payment link missing falls back to default
- **WHEN** the `settings` collection has no `mercadopago_payment_link` document
- **AND** a buyer triggers the Mercado Pago checkout flow
- **THEN** the checkout response includes `paymentLinkUrl: "https://link.mercadopago.com.br/presentecarolejoao"`

#### Scenario: Admin clears the URL
- **WHEN** the admin saves an empty string in the URL field
- **THEN** the action returns `{ success: false, error: "Informe uma URL válida." }` and the stored value is unchanged

### Requirement: Checkout endpoint captures buyer intent and returns the shared link
The `POST /api/gifts/[id]/checkout` endpoint SHALL NOT call the Mercado Pago API. For gifts with `purchaseMode: "mercadopago"`, the endpoint SHALL validate the gift, capture buyer info, insert a `pending_payments` document, and return `{ paymentLinkUrl, amount, pendingId }` where `amount` is the gift price in BRL (decimal, not cents).

#### Scenario: Multi-purchase gift checkout
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` for a gift with `singlePurchase: false` with valid buyer info
- **THEN** a `pending_payments` document is inserted with `{ giftId, buyerInfo, amount: <gift.price / 100>, status: "pending", createdAt: <iso> }`
- **AND** the response is `{ paymentLinkUrl: <settings url>, amount: <gift.price / 100>, pendingId: <inserted id as string> }` with HTTP 200
- **AND** the gift document is NOT modified (no reservation)

#### Scenario: Single-purchase gift checkout reserves
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` for a gift with `singlePurchase: true, status: "available"` with valid buyer info
- **THEN** the gift document is atomically updated to `status: "reserved"`, `reservedAt: <iso>`, and the buyer fields are mirrored on the gift document (`buyerType`, `buyerName`, `buyerNames`)
- **AND** a `pending_payments` document is inserted with the same buyer info, gift id, and amount snapshot
- **AND** the response is `{ paymentLinkUrl, amount, pendingId }` with HTTP 200

#### Scenario: Single-purchase gift already reserved
- **WHEN** two buyers POST to `/api/gifts/[id]/checkout` concurrently for the same `singlePurchase: true` gift
- **THEN** exactly one receives HTTP 200 with `{ paymentLinkUrl, amount, pendingId }`
- **AND** the other receives HTTP 409 with `{ error: "Este presente já foi reservado." }` and no `pending_payments` row is created for them

#### Scenario: Gift not found
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` with an `id` that does not match any gift
- **THEN** the response is HTTP 404 with `{ error: "Presente não encontrado." }` and no `pending_payments` row is created

### Requirement: Claim modal renders amount, copy button, and Mercado Pago CTA for mercadopago gifts
The `ClaimModal` component, when invoked with `mode: "mercadopago"`, SHALL render the gift amount prominently in BRL formatting, a button that copies the amount value to the clipboard, a 3-step instruction list in pt-BR, and a primary CTA that opens the returned `paymentLinkUrl` in a new tab with `rel="noopener noreferrer"`. The modal SHALL submit the buyer info form to `/api/gifts/[id]/checkout` before revealing the CTA, and SHALL surface the server's error message on HTTP 409 or 4xx/5xx responses.

#### Scenario: Buyer confirms claim and sees payment instructions
- **WHEN** a buyer fills the claim modal and clicks "Confirmar" on a gift priced R$ 150,00
- **AND** the checkout endpoint returns `{ paymentLinkUrl: "https://link.mercadopago.com.br/presentecarolejoao", amount: 150, pendingId: "..." }`
- **THEN** the modal renders "R$ 150,00" in a large font, a "Copiar valor" button, a numbered 3-step list ("1. Copie o valor", "2. Abra o Mercado Pago", "3. Cole o valor e finalize o pagamento"), and an "Abrir Mercado Pago" link with `href` set to the returned URL, `target="_blank"`, and `rel="noopener noreferrer"`

#### Scenario: Copy button copies amount to clipboard
- **WHEN** the buyer clicks "Copiar valor" on a R$ 150,00 gift
- **THEN** the string `"150,00"` is written to the clipboard
- **AND** the button label changes to "Copiado!" for ~2 seconds

#### Scenario: Single-purchase gift conflict surfaces to the buyer
- **WHEN** the buyer clicks "Confirmar" and the checkout endpoint returns HTTP 409 with `{ error: "Este presente já foi reservado." }`
- **THEN** the modal renders the error message inline and does NOT render the Mercado Pago CTA

### Requirement: Admin pending-payments page lists and reconciles pending intents
The `/admin/pending-payments` page SHALL list every `pending_payments` document with `status: "pending"`, joined with the matching gift's name and current price. Each row SHALL display buyer name, buyer type, gift name, captured amount, and `createdAt`. Each row SHALL include a "Confirmar" button and a "Cancelar" button.

#### Scenario: Admin views pending payments
- **WHEN** the admin opens `/admin/pending-payments`
- **AND** the `pending_payments` collection contains 2 documents with `status: "pending"` and 5 documents with other statuses
- **THEN** the page lists exactly 2 rows, each showing buyer name, buyer type badge, gift name, formatted amount (e.g., "R$ 150,00"), and creation date

#### Scenario: Admin confirms a pending payment for a single-purchase gift
- **WHEN** the admin clicks "Confirmar" on a pending row whose gift has `singlePurchase: true` and `status: "reserved"`
- **THEN** the gift document is atomically updated to `status: "purchased"`, `paymentId: null`, `updatedAt: <iso>`
- **AND** the `pending_payments` row is updated to `status: "confirmed"`, `confirmedAt: <iso>`
- **AND** the page reloads and the row no longer appears in the pending list

#### Scenario: Admin confirms a pending payment for a multi-purchase gift
- **WHEN** the admin clicks "Confirmar" on a pending row whose gift has `singlePurchase: false`
- **THEN** a new entry is appended to the gift's `purchases[]` with `source: "mercadopago"`, the buyer info from the pending row, `paymentId: null`, and `purchasedAt: <iso>`
- **AND** the gift's top-level `status` remains `"available"`
- **AND** the `pending_payments` row is updated to `status: "confirmed"`, `confirmedAt: <iso>`

#### Scenario: Admin cancels a pending payment for a single-purchase gift
- **WHEN** the admin clicks "Cancelar" on a pending row whose gift has `singlePurchase: true` and `status: "reserved"`
- **THEN** the gift document is updated to `status: "available"`, `reservedAt: null`, and the mirrored buyer fields are cleared
- **AND** the `pending_payments` row is updated to `status: "cancelled"`, `cancelledAt: <iso>`

#### Scenario: Admin cancels a pending payment for a multi-purchase gift
- **WHEN** the admin clicks "Cancelar" on a pending row whose gift has `singlePurchase: false`
- **THEN** the gift document is NOT modified
- **AND** the `pending_payments` row is updated to `status: "cancelled"`, `cancelledAt: <iso>`

### Requirement: Mercado Pago API integration is removed
The system SHALL NOT depend on the `mercadopago` npm package or `MERCADOPAGO_ACCESS_TOKEN`. There SHALL be no route under `/api/webhooks/mercadopago`. There SHALL be no `mp_errors` collection write path. The lookup helpers `encodeBuyerRef`/`decodeBuyerRef` SHALL be removed unless an external caller still depends on them.

#### Scenario: No MP SDK in dependencies
- **WHEN** the repository's `package.json` is inspected
- **THEN** there is no `mercadopago` entry under `dependencies` or `devDependencies`

#### Scenario: Webhook route is absent
- **WHEN** a request is sent to `POST /api/webhooks/mercadopago`
- **THEN** the response is HTTP 404 (Next.js default for an absent route)

#### Scenario: No MP_ACCESS_TOKEN required at boot
- **WHEN** the application starts with `MERCADOPAGO_ACCESS_TOKEN` unset
- **THEN** the application starts normally and the public gift list works end-to-end
