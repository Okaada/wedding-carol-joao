## Context

`/presentes` is a Server Component (`export const dynamic = "force-dynamic"`) that reads the `gifts` collection and renders a grid of `GiftCard` Client Components. In the React Server Components model, anything a Server Component passes as props to a Client Component is serialized into the payload streamed to the browser — regardless of whether the UI renders it. The current code does:

```ts
const gifts = docs.map((d) => ({ ...d, _id: d._id.toString() })) as Gift[];
// ...
<GiftCard gift={gift} ... />
```

`Gift` (the storage shape) carries buyer PII: `buyerName`, `buyerNames`, `claimedBy`, and `purchases[]` (each `Purchase` has `buyerName` + `buyerNames`). All of it ships to anonymous clients.

The same risk exists anywhere a Server Component spreads a `gifts` document into client props.

## Goals / Non-Goals

**Goals:**
- Guarantee no buyer-identifying field is serialized to unauthenticated clients on public pages.
- Make the public contract explicit via a `PublicGift` type the compiler enforces.
- Add a cheap regression guard so the leak cannot silently return.

**Non-Goals:**
- Changing the admin pages (they legitimately read buyer info behind `auth()`).
- Changing the storage schema or the `Gift` interface used server-side.
- Rate limiting / abuse protection of write endpoints (covered by `protect-public-write-endpoints`).

## Decisions

### 1. Defense in depth: project at the query AND whitelist at the view model

**Choice**: Add `.project({ purchases: 0, buyerName: 0, buyerNames: 0, claimedBy: 0, paymentId: 0, reservedAt: 0 })` to the public query, AND map results into an explicit `PublicGift` object listing only public fields.

**Rationale**: Projection stops the data at the DB boundary (minimizes what the process even holds); the explicit view model stops a future `{ ...d }` from re-leaking and gives a typed contract. Either alone is weaker — projection can be forgotten on a new query; a view model still pulls PII into process memory.

**Alternatives considered**:
- View model only — PII still travels DB→server; one careless spread re-leaks it.
- Projection only — no compile-time contract; trivially regressed.

### 2. `status` is still public; buyer identity is not

The card needs `status` (to render available/reserved/claimed UI) and `price`/`name`/`imageUrl`/`description`/`externalUrl`/`purchaseMode`/`singlePurchase`. None of those identify a guest. `claimedBy`/`buyerName`/`purchases` are never needed by the public card.

### 3. Regression guard

**Choice**: A lightweight check (unit test or a server-side assertion in dev) that serializes the public payload for a fixture gift with populated buyer fields and asserts the output JSON contains none of the forbidden keys.

**Rationale**: The leak is invisible in the rendered UI, so only an explicit assertion catches a regression. Keeps it framework-agnostic.

## Risks / Trade-offs

- **[Other public readers]** If another public page/route reads `gifts` and spreads it, it has the same bug → Task includes a `grep` sweep for `collection<...>("gifts")` and `{ ...` spreads on public paths.
- **[Type drift]** `PublicGift` must stay a strict subset of `Gift` → Derive it with `Pick<Gift, ...>` so adding a sensitive field to `Gift` does not silently widen `PublicGift`.
- **[Cache]** Page is `force-dynamic`, so no stale cached payload with PII persists after deploy. If any caching is added later, the old payload must be invalidated.
