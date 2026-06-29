## ADDED Requirements

### Requirement: Rate limit unauthenticated gift write endpoints
The system SHALL rate limit the public `POST /api/gifts/[id]/claim` and `POST /api/gifts/[id]/checkout` endpoints per client IP, using MongoDB-backed counters with TTL auto-expiry. When a client IP exceeds 10 requests to a given endpoint within a 10-minute window, the system SHALL reject further requests to that endpoint with HTTP `429` and a Portuguese message, performing no database write.

#### Scenario: Claim requests over the limit are rejected
- **WHEN** a single IP sends an 11th `claim` request to any gift within 10 minutes
- **THEN** the system returns HTTP `429` with a Portuguese "muitas tentativas" message
- **AND** no entry is appended to any gift's `purchases[]`

#### Scenario: Checkout requests over the limit are rejected
- **WHEN** a single IP sends an 11th `checkout` request within 10 minutes
- **THEN** the system returns HTTP `429`
- **AND** no `pending_payments` row is created and no gift is reserved

#### Scenario: Counter expires automatically
- **WHEN** the 10-minute window has elapsed since a client's first counted request
- **THEN** the MongoDB TTL index removes the counter and the client may request again

#### Scenario: Normal guest is unaffected
- **WHEN** a guest performs a single claim or checkout
- **THEN** the request succeeds exactly as before the rate limit existed

### Requirement: Bound guest-controlled input size
The `claim` and `checkout` endpoints SHALL reject, with HTTP `400` and before any database write, any request where `buyerNames` has more than 20 entries, where any `buyerNames` entry exceeds 80 characters, or where `buyerName` exceeds 80 characters.

#### Scenario: Oversized buyerNames array rejected
- **WHEN** a `claim` request includes a `buyerNames` array with 1000 entries
- **THEN** the system returns HTTP `400` and appends nothing to `purchases[]`

#### Scenario: Oversized name string rejected
- **WHEN** a request includes a `buyerName` longer than 80 characters
- **THEN** the system returns HTTP `400` and performs no write

### Requirement: Cap active reservations per client
Before reserving a `singlePurchase: true` gift via `checkout`, the system SHALL count the requesting IP's active `pending` reservations within the reservation window and SHALL reject the request with HTTP `429` when that count is 5 or more, so a single client cannot reserve the entire catalog.

#### Scenario: Client cannot reserve the whole catalog
- **WHEN** an IP already holds 5 active `pending` single-purchase reservations and requests checkout on a 6th
- **THEN** the system returns HTTP `429`
- **AND** the 6th gift remains `available` with no new `pending_payments` row

#### Scenario: Reservation slot frees up after expiry
- **WHEN** one of the client's reservations passes the 30-minute expiry and is released
- **THEN** the client may reserve another single-purchase gift
