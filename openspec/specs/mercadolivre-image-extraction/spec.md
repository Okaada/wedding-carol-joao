# mercadolivre-image-extraction Specification

## Purpose
Extract the primary product image from Mercado Livre product URLs to auto-populate gift thumbnails when admins enter an ML link.
## Requirements
### Requirement: Extract primary image from Mercado Livre URL
The system SHALL extract the primary product image from a Mercado Livre product URL by fetching the page HTML and reading the `og:image` meta tag value. To prevent server-side request forgery via redirects, the fetch SHALL NOT transparently follow cross-origin redirects: it SHALL use manual redirect handling and re-validate that any redirect target still resolves to an allowed Mercado Livre host, and SHALL only fetch URLs whose final protocol is `https:`. The extracted `og:image` value SHALL be accepted only if it is an `http`/`https` URL.

#### Scenario: Valid Mercado Livre URL with og:image
- **WHEN** a Mercado Livre URL (matching `mercadolivre.com.br` or `mercadolibre.com`) is provided over HTTPS
- **THEN** the system fetches the page HTML and extracts the `og:image` meta tag content as the image URL

#### Scenario: URL is not from Mercado Livre
- **WHEN** the `externalUrl` does not match a Mercado Livre domain
- **THEN** the system SHALL NOT attempt image extraction and SHALL leave `imageUrl` unchanged

#### Scenario: Redirect to a non-allowed or non-HTTPS host is refused
- **WHEN** a validated Mercado Livre URL responds with a redirect to a host that is not an allowed Mercado Livre domain, or to a non-`https:` URL
- **THEN** the system SHALL NOT follow the redirect to that target and SHALL proceed without setting an image URL (non-fatal failure)

#### Scenario: Extracted image URL with a disallowed protocol is rejected
- **WHEN** the `og:image` content is not an `http`/`https` URL (e.g. a `data:` or `javascript:` value)
- **THEN** the system SHALL discard it and proceed without setting an image URL

#### Scenario: Fetch fails or og:image not found
- **WHEN** the HTTP fetch fails, times out, or the page does not contain an `og:image` meta tag
- **THEN** the system SHALL proceed without setting an image URL (non-fatal failure)

### Requirement: Auto-populate imageUrl on gift creation
The system SHALL automatically set the gift's `imageUrl` to the extracted Mercado Livre image when a gift is created with an `externalUrl` from Mercado Livre and no `imageUrl` is provided.

#### Scenario: Gift created with ML URL and no image
- **WHEN** an admin creates a gift with a Mercado Livre `externalUrl` and leaves `imageUrl` empty
- **THEN** the system SHALL extract the image from the Mercado Livre URL and save it as the gift's `imageUrl`

#### Scenario: Gift created with ML URL and manual image
- **WHEN** an admin creates a gift with a Mercado Livre `externalUrl` and provides an explicit `imageUrl`
- **THEN** the system SHALL use the manually provided `imageUrl` and NOT extract from Mercado Livre

### Requirement: Auto-populate imageUrl on gift update
The system SHALL automatically update the gift's `imageUrl` from the Mercado Livre URL when an admin updates a gift's `externalUrl` to a Mercado Livre link and clears or leaves empty the `imageUrl`.

#### Scenario: Gift updated with new ML URL and no image
- **WHEN** an admin updates a gift's `externalUrl` to a Mercado Livre URL and leaves `imageUrl` empty
- **THEN** the system SHALL extract the image from the new Mercado Livre URL and save it as the gift's `imageUrl`

#### Scenario: Gift updated with manual image override
- **WHEN** an admin updates a gift and provides an explicit `imageUrl`
- **THEN** the system SHALL use the manually provided `imageUrl` regardless of `externalUrl`

### Requirement: Fetch timeout
The Mercado Livre page fetch SHALL have a maximum timeout of 5 seconds to prevent slow gift save operations.

#### Scenario: Fetch exceeds timeout
- **WHEN** the Mercado Livre page does not respond within 5 seconds
- **THEN** the system SHALL abort the fetch and proceed without an image (non-fatal)

