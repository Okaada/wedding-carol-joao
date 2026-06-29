## Why

The public `/presentes` page leaks guest PII without any authentication. In `src/app/presentes/page.tsx`, the gift documents are spread verbatim (`{ ...d }`) into the props of the `GiftCard` **client** component. Because `GiftCard` is a Client Component, every field of the document — including `buyerName`, `buyerNames[]`, `claimedBy`, and the entire `purchases[]` array (one buyer record per purchase) — is serialized into the RSC/HTML payload sent to **any anonymous visitor**. Anyone can run `curl /presentes | grep buyerName` and recover the full list of guests who gave gifts and what each one gave. This is an unauthenticated personal-data exposure (LGPD: processing/disclosure of personal data with no legal basis and no necessity).

The root cause is the absence of a server→client data boundary: the page treats a private storage document as if it were a public view model.

## What Changes

- The `/presentes` data layer SHALL `project` the gift query so buyer-identifying fields never leave MongoDB for the public page (`purchases`, `buyerName`, `buyerNames`, `claimedBy`, `paymentId`, `reservedAt`).
- The page SHALL build an explicit **public gift view model** (whitelist of fields) instead of spreading the raw document into client props.
- A regression guard SHALL assert that the serialized public payload contains none of the buyer-identifying fields.

## Capabilities

### New Capabilities
- `gift-data-privacy`: Defines the public gift view model and forbids serializing buyer PII to unauthenticated clients.

### Modified Capabilities
<!-- No existing spec-level requirements change behavior; this adds a data-exposure constraint that the existing /presentes requirements were silent about. -->

## Impact

- **Code**: `src/app/presentes/page.tsx` (projection + explicit view model). `src/data/types.ts` (introduce a `PublicGift` type). Review any other public reader of the `gifts` collection.
- **Database**: No schema change. Read queries gain a `.project()` clause.
- **APIs**: No public contract change for guests; the leaked fields were never part of the intended contract.
- **Severity**: CRITICAL — ship and deploy before any wider distribution of the site link.
