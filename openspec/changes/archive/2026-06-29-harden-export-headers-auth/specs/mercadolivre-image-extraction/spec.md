## MODIFIED Requirements

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
