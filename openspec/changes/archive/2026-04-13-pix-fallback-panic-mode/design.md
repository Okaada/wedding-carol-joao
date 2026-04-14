## Context

The checkout endpoint (`POST /api/gifts/[id]/checkout`) creates a Mercado Pago payment preference. On failure, it rolls back the reservation and returns a 500 error. Currently errors are only logged to `console.error` — no persistence, no tracking, no fallback.

The site already has:
- PIX QR code generation (`src/lib/pix.ts`) with amount support
- PIX settings stored in MongoDB `settings` collection (`key: "pix"`)
- External gifts already show PIX QR codes in the claim modal
- The presentes page pre-generates PIX data for external gifts

## Goals / Non-Goals

**Goals:**
- Manual panic mode toggle in admin settings
- Automatic panic mode triggered by 3+ MP errors in a single day
- When panic mode is active, mercadopago gifts show PIX QR code in claim modal instead of redirecting to MP
- Admin visibility of panic mode status and daily error count

**Non-Goals:**
- Retry logic for Mercado Pago (if it's down, we fall back — no retries)
- Alerting (email/SMS) when panic mode activates — admin checks the panel
- Historical error analytics or dashboards
- Changing the webhook flow (payments already confirmed via MP still work)

## Decisions

### 1. Store panic mode as a settings document

**Decision**: Add a `{ key: "panic_mode", value: { enabled: boolean, enabledAt: string | null } }` document in the `settings` collection.

**Rationale**: Reuses the existing settings pattern (same collection, same upsert approach). Simple boolean toggle. `enabledAt` tracks when it was manually enabled.

**Alternative considered**: A separate collection — rejected, overkill for a single boolean.

### 2. Log MP errors to a lightweight `mp_errors` collection

**Decision**: On each Mercado Pago failure in the checkout endpoint, insert a document: `{ giftId, error: string, createdAt: ISOString }`. To check auto-trigger, count documents where `createdAt >= start of today`.

**Rationale**: Simple append-only log. Counting today's errors is a single `countDocuments` query with a date filter. No indexes needed for the expected volume (a handful of errors per day at most).

### 3. Check panic mode status in the presentes page (server-side)

**Decision**: The presentes page checks both manual panic mode and the auto-trigger (count today's MP errors >= 3). If either is active, generate PIX data for ALL gifts with price > 0 (not just external ones), and pass a `panicMode: true` flag to each `GiftCard`.

**Rationale**: The presentes page already generates PIX data for external gifts. Extending this to all gifts when panic mode is active is a small change. The `panicMode` prop tells `GiftCard` to behave like an external gift (open claim modal with PIX instead of MP checkout).

### 4. GiftCard behavior in panic mode

**Decision**: When `panicMode` is true, a `mercadopago` gift's "Presentear" button opens the claim modal with PIX QR code (same as external gifts), and calls the `/api/gifts/[id]/claim` endpoint instead of `/api/gifts/[id]/checkout`.

**Rationale**: If MP is down, there's no point calling the checkout endpoint. The claim endpoint records buyer info and marks the gift as "claimed". The PIX QR code lets the guest pay directly.

### 5. Admin settings UI for panic mode

**Decision**: Add a section to the existing admin settings page with:
- A toggle button for manual panic mode (on/off)
- Display of today's MP error count
- Status indicator: "Desativado" / "Ativado manualmente" / "Ativado automaticamente (X erros hoje)"

**Rationale**: Keeps all settings on one page. The couple can see at a glance if something is wrong and take action.

## Risks / Trade-offs

- **[False positives on auto-trigger]** 3 transient errors could trigger panic mode unnecessarily. → Acceptable trade-off: PIX fallback works fine, and it only lasts until the next day (error count resets). Admin can also manually disable.
- **[No auto-recovery]** Once auto-triggered, panic mode stays active for the rest of the day even if MP recovers. → By design: stability over optimization on a wedding day. The couple can manually disable if needed.
- **[PIX payments are unverified]** Guests could claim a gift via PIX without actually paying. → Same trust model as external gifts. Acceptable for a wedding context.
