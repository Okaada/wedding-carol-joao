## 1. CSV formula injection

- [x] 1.1 In `src/lib/csv.ts`, add a `neutralize()` step: if a value starts with `=`, `+`, `-`, `@`, `\t`, or `\r`, prefix it with `'` before the existing RFC quote/comma/newline escaping
- [x] 1.2 Confirm both headers and rows pass through neutralization

## 2. Login rate limiting hardening

- [x] 2.1 Add an IP-keyed counter alongside the email-keyed counter in `src/lib/auth-utils.ts` (reuse `login_attempts` with an `ip:`-prefixed key or a dedicated field)
- [x] 2.2 Update lockout logic in `authorize()` so a legitimate user is not locked out solely by email-targeted attempts from foreign IPs
- [x] 2.3 On unknown email, run a dummy `bcrypt.compare` against a fixed hash so timing matches the valid-email path

## 3. Security headers

- [x] 3.1 Add `async headers()` in `next.config.ts` returning `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP
- [x] 3.2 Scope CSP `img-src` to include `self`, the ML image CDN, and `data:` (PIX QR codes); allow the Mercado Pago link domain where needed

## 4. ML scraper SSRF hardening

- [x] 4.1 In `src/lib/mercadolivre.ts`, set `redirect: "manual"` (or re-validate the host on each redirect hop) and reject final URLs whose protocol is not `https:`
- [x] 4.2 Validate the extracted `og:image` is an `http(s)` URL before returning/storing it

## 5. Verification

- [ ] 5.1 Submit an RSVP with name `=HYPERLINK("http://x","y")`, export the CSV, open it, and confirm the cell is literal text (leading `'`)
- [ ] 5.2 Confirm an admin email targeted with 5 failures from one IP does NOT lock the real user logging in from a different IP, while brute force from a single IP is still throttled
- [ ] 5.3 Measure login response time for a known-nonexistent email vs a known email with wrong password; confirm they are comparable (no timing oracle)
- [ ] 5.4 Inspect response headers in the browser for CSP/HSTS/X-Frame-Options/nosniff/Referrer-Policy; confirm `/presentes` gift images and PIX QR codes still render and the MP link still works
- [ ] 5.5 Point an ML `externalUrl` at a host that redirects cross-origin; confirm the fetch does not follow it to a non-ML/non-HTTPS target
- [x] 5.6 `npm run lint` and `npm run build` pass
