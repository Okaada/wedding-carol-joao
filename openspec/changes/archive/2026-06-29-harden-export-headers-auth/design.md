## Context

This change groups four independent hardening items that share a theme (output/transport/auth hygiene) and are individually too small to justify separate proposals. None block the P0/P1 work; they can ship together once the critical surface is closed.

- `src/lib/csv.ts` is the single CSV serializer, used by `/api/rsvp/export`. It already handles RFC 4180 quoting.
- Login rate limiting lives in `src/lib/auth-utils.ts` (`checkRateLimit`, `recordFailedAttempt`) and is wired in `authorize()` in `src/lib/auth.ts`. It is keyed by normalized email only.
- `next.config.ts` is empty (no `headers()`).
- `extractMercadoLivreImage` (`src/lib/mercadolivre.ts`) is admin-only (called from authenticated `createGift`/`updateGift`), which already bounds the SSRF risk; this change closes the residual redirect/protocol gap.

## Goals / Non-Goals

**Goals:**
- Make exported CSVs safe to open in Excel/Sheets.
- Remove the account-lockout DoS and login timing oracle without weakening brute-force protection.
- Apply a sane baseline of security headers including a CSP.
- Close the redirect/protocol gap in the ML scraper.

**Non-Goals:**
- 2FA/MFA or admin roles (out of scope; noted as future work).
- A nonce-based strict CSP for inline scripts (start with a pragmatic policy; tighten later).
- Replacing the ML scraping approach.

## Decisions

### 1. CSV neutralization in addition to RFC escaping

**Choice**: If a cell value starts with `=`, `+`, `-`, `@`, TAB (`\t`), or CR (`\r`), prefix it with a single quote `'` before applying the existing quote/comma/newline escaping.

**Rationale**: This is the OWASP-recommended mitigation and is preserved by Excel/Sheets as a literal. The fields are guest-controlled, so the serializer is the right chokepoint (fix once, covers every export).

**Alternatives considered**: Stripping the leading char (data loss); refusing export (breaks the feature).

### 2. Composite (IP + email) rate limiting and constant-time unknown user

**Choice**: Keep the email-keyed counter but add an IP-keyed counter, and lock only when *both* signals indicate abuse — i.e. do not lock a legitimate user out solely because their email was targeted from foreign IPs. On unknown email, run a dummy `bcrypt.compare` against a fixed hash so the response time matches the valid-email path.

**Rationale**: Pure email-keying enables account-lockout DoS; pure IP-keying is weak behind NAT. Combining them preserves brute-force protection while removing the trivial lockout vector. The dummy compare removes the timing oracle for user enumeration.

**Alternatives considered**: IP-only (NAT issues); CAPTCHA (UX cost for 1-3 admins).

### 3. Pragmatic security headers via `next.config.ts` `headers()`

**Choice**: Add `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP that allows `self`, the Mercado Pago link domain, and image sources actually used (ML CDN, inline data URLs for PIX QR codes).

**Rationale**: `frame-ancestors 'none'`/`X-Frame-Options` kills clickjacking on `/admin`; CSP caps XSS blast radius. PIX QR codes are `data:` URLs (`generatePixQrCodeDataUrl`), so `img-src` must include `data:`.

**Risk**: An over-tight CSP can break images/links. Start permissive on `img-src`, validate the gift images and QR codes still render, then tighten.

### 4. ML scraper: manual redirect + HTTPS-only

**Choice**: Set `redirect: "manual"` on the fetch (or re-validate the host on each redirect hop) and reject a final URL whose protocol is not `https:`. Validate the extracted `og:image` is an `http(s)` URL before storing.

**Rationale**: Prevents a validated ML host from redirecting the server-side fetch to an internal endpoint, and prevents storing a non-http(s) image URL that ends up in `<img src>`.

## Risks / Trade-offs

- **[CSP breakage]** Mis-scoped CSP hides images or blocks the MP link → Mitigated by verifying `/presentes` (gift images + PIX QR) and the MP CTA after applying headers.
- **[IP fidelity]** Composite limiting still leans on `x-forwarded-for` → Acceptable; email dimension remains as the strong signal.
- **[Dummy compare cost]** Adds a bcrypt round to unknown-email logins → Negligible and intentional (constant time).
- **[ML manual redirect]** Some ML URLs may legitimately redirect → Re-validate host on redirect rather than hard-blocking all 30x if needed.
