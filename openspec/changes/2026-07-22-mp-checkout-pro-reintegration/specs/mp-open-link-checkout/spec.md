## MODIFIED Requirements

### Requirement: Checkout endpoint captures buyer intent and returns the shared link or a Checkout Pro redirect
The `POST /api/gifts/[id]/checkout` endpoint SHALL always validate the gift, capture buyer info, and insert a `pending_payments` document exactly as before. When the `mp-checkout-pro` feature flag is disabled, or the flag is enabled but no Mercado Pago access token is configured, or a Mercado Pago Preference-creation attempt fails, the endpoint SHALL return `{ paymentLinkUrl, amount, pendingId }` as it does today. Only when the flag is enabled, a token is configured, and Preference creation succeeds does the endpoint instead return `{ checkoutUrl, amount, pendingId }` (see the `mp-checkout-pro` capability for that path's requirements).

#### Scenario: Multi-purchase gift checkout with Checkout Pro disabled
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` for a gift with `singlePurchase: false` with valid buyer info, and the Checkout Pro flag is disabled
- **THEN** a `pending_payments` document is inserted with `{ giftId, buyerInfo, amount: <gift.price / 100>, status: "pending", createdAt: <iso> }`
- **AND** the response is `{ paymentLinkUrl: <settings url>, amount: <gift.price / 100>, pendingId: <inserted id as string> }` with HTTP 200
- **AND** the gift document is NOT modified (no reservation)

#### Scenario: Single-purchase gift checkout reserves regardless of checkout path
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` for a gift with `singlePurchase: true, status: "available"` with valid buyer info
- **THEN** the gift document is atomically updated to `status: "reserved"`, `reservedAt: <iso>`, and the buyer fields are mirrored on the gift document (`buyerType`, `buyerName`, `buyerNames`)
- **AND** a `pending_payments` document is inserted with the same buyer info, gift id, and amount snapshot
- **AND** this reservation step is identical whether the response ends up being the open-link shape or the Checkout Pro shape

#### Scenario: Single-purchase gift already reserved
- **WHEN** two buyers POST to `/api/gifts/[id]/checkout` concurrently for the same `singlePurchase: true` gift
- **THEN** exactly one receives HTTP 200
- **AND** the other receives HTTP 409 with `{ error: "Este presente já foi reservado." }` and no `pending_payments` row is created for them

#### Scenario: Gift not found
- **WHEN** a buyer POSTs to `/api/gifts/[id]/checkout` with an `id` that does not match any gift
- **THEN** the response is HTTP 404 with `{ error: "Presente não encontrado." }` and no `pending_payments` row is created

## REMOVED Requirements

### Requirement: Mercado Pago API integration is removed
**Reason**: Superseded by the `mp-checkout-pro` capability. The `mercadopago` npm package, `MERCADOPAGO_ACCESS_TOKEN`, and a route under `/api/webhooks/mercadopago` are reintroduced, but gated behind the `mercadopago_checkout_pro` feature flag and always falling back to the open-link flow this capability still owns. The absolute "SHALL NOT depend on" language no longer holds; see `mp-checkout-pro`'s requirements for the conditions under which the API is used, and for the webhook's signature-verification requirement (which the pre-`mp-open-payment-link` implementation of this same route lacked).
**Migration**: No data migration. Deployments that never enable the new flag and never set `MERCADOPAGO_ACCESS_TOKEN` observe no behavior change — the scenarios this requirement protected (no MP call at boot, webhook route absent from a functional standpoint) still hold in practice, just not as an absolute code-level guarantee.
