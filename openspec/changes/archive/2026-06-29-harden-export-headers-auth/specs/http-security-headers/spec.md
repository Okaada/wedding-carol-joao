## ADDED Requirements

### Requirement: Baseline security response headers
The application SHALL send a baseline set of security headers on all responses: `Strict-Transport-Security` (with a non-zero `max-age` and `includeSubDomains`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy`.

#### Scenario: Headers present on a public page
- **WHEN** any client requests `/presentes` or `/`
- **THEN** the response includes `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Content-Security-Policy`

#### Scenario: Admin cannot be framed
- **WHEN** a third-party page attempts to embed `/admin` in an iframe
- **THEN** the browser blocks the frame due to `X-Frame-Options: DENY` (and/or CSP `frame-ancestors 'none'`)

### Requirement: CSP permits required app resources
The Content-Security-Policy SHALL allow the resources the app legitimately uses while denying everything else by default. At minimum it SHALL permit `'self'`, inline `data:` images (used for PIX QR codes generated via data URLs), the Mercado Livre image source used for gift thumbnails, and navigation to the Mercado Pago payment link domain.

#### Scenario: Gift images and PIX QR codes still render
- **WHEN** a guest views `/presentes` with external-mode gifts
- **THEN** gift thumbnail images and the inline `data:` PIX QR codes render without CSP violations

#### Scenario: Mercado Pago link still works
- **WHEN** a guest proceeds to the shared Mercado Pago payment link
- **THEN** navigation to the `link.mercadopago.com.br` domain is not blocked by the policy

#### Scenario: Disallowed origin is blocked
- **WHEN** the page attempts to load a script or resource from an origin not permitted by the policy
- **THEN** the browser blocks the request per the CSP
