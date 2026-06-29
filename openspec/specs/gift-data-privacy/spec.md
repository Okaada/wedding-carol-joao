# gift-data-privacy Specification

## Purpose
TBD - created by archiving change harden-public-data-exposure. Update Purpose after archive.
## Requirements
### Requirement: Public gift payload excludes buyer PII
Pages and endpoints reachable without authentication SHALL NOT serialize buyer-identifying fields of a gift to the client. The forbidden fields are `buyerName`, `buyerNames`, `claimedBy`, `paymentId`, `reservedAt`, and every element of the `purchases[]` array. Public surfaces SHALL expose only a `PublicGift` view model containing `_id`, `name`, `description`, `imageUrl`, `price`, `externalUrl`, `purchaseMode`, `singlePurchase`, `status`, and `sortOrder`.

#### Scenario: Anonymous request to /presentes omits buyer identity
- **WHEN** an unauthenticated visitor loads `/presentes`
- **AND** the catalog contains a gift whose `purchases[]` and `buyerName` are populated
- **THEN** the HTML/RSC payload returned to the browser contains none of `buyerName`, `buyerNames`, `claimedBy`, `paymentId`, or `purchases`
- **AND** the gift still renders with the correct available/reserved/claimed UI derived from `status`

#### Scenario: Public query projects away sensitive fields
- **WHEN** the `/presentes` page queries the `gifts` collection
- **THEN** the query includes a projection that excludes `purchases`, `buyerName`, `buyerNames`, `claimedBy`, `paymentId`, and `reservedAt`
- **AND** the documents loaded into server memory for the public render do not contain those fields

#### Scenario: Client component receives only the public view model
- **WHEN** the server renders a gift card for the public catalog
- **THEN** the props passed to the client component conform to the `PublicGift` type
- **AND** no raw storage document is spread into the client props

### Requirement: Authenticated surfaces may still read buyer info
The constraint above SHALL apply only to unauthenticated surfaces. Admin pages and actions guarded by `auth()` SHALL continue to read and display buyer-identifying fields as needed for reconciliation.

#### Scenario: Admin gift table shows buyer info
- **WHEN** an authenticated admin loads a page that lists buyers (e.g. pending payments or gift detail)
- **THEN** buyer-identifying fields remain available to that authenticated render

