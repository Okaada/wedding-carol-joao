## Why

Four lower-severity but real hardening gaps remain after the critical/high fixes:

- **CSV formula injection (MEDIUM)** — `src/lib/csv.ts` escapes per RFC 4180 (quotes/commas/newlines) but does not neutralize spreadsheet formulas. Guest-controlled values exported via `/api/rsvp/export` (e.g. `name`, `cellphone`) that start with `=`, `+`, `-`, `@`, TAB, or CR are executed as formulas when the admin opens the CSV in Excel/Sheets — enabling data exfiltration or command execution on the admin's machine.
- **Login lockout keyed only by email (MEDIUM)** — `login_attempts` is keyed solely by email, so knowing an admin's email lets an attacker lock that account out for 15 minutes from anywhere (account-lockout DoS). Additionally, unknown emails return fast (no `bcrypt.compare`) while valid emails run the slow hash, leaking which emails exist via response timing (user enumeration).
- **Missing security headers (MEDIUM)** — `next.config.ts` is empty: no CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, or `Referrer-Policy`. Any future XSS has maximum blast radius and `/admin` is clickjackable.
- **SSRF hardening on the ML scraper (LOW)** — `extractMercadoLivreImage` validates the host but follows redirects by default (a validated ML host could 30x-redirect to an internal address) and the extracted `og:image` is rendered as `<img src>` without protocol validation.

## What Changes

- Neutralize CSV formula triggers by prefixing risky values with a single quote, on top of the existing RFC escaping.
- Add a per-IP dimension to login rate limiting and make the unknown-user path constant-time (dummy `bcrypt.compare`).
- Add security response headers (CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`).
- Make the ML fetch use manual redirect handling and accept only `https:` final URLs; validate the extracted image URL protocol.

## Capabilities

### New Capabilities
- `secure-csv-export`: CSV serialization neutralizes spreadsheet formula injection.
- `http-security-headers`: Baseline security response headers on all routes.

### Modified Capabilities
- `login-rate-limiting`: Add per-IP limiting and constant-time response for unknown users.
- `mercadolivre-image-extraction`: Disallow cross-origin redirects and non-HTTPS image URLs (SSRF hardening).

## Impact

- **Code**: `src/lib/csv.ts`, `src/lib/auth.ts`, `src/lib/auth-utils.ts`, `next.config.ts`, `src/lib/mercadolivre.ts`.
- **Database**: `login_attempts` gains/uses an IP-scoped key variant; no new collection required.
- **APIs**: New response headers globally; no contract change to existing endpoints.
- **Severity**: MEDIUM (CSV, lockout, headers) and LOW (SSRF) — schedule after P0/P1.
