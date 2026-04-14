## Why

The admin login currently relies on credentials-only authentication with no rate limiting, no CSRF state validation, and no login attempt tracking. A brute-force attack could compromise admin accounts, and there's no audit trail for security-relevant events. Adding rate limiting, OAuth state persistence in MongoDB, and login audit logging will harden the admin authentication surface.

## What Changes

- Add **login rate limiting** — block IP/email combinations after repeated failed attempts, storing attempt counters in MongoDB with TTL-based auto-expiry
- Add **OAuth/CSRF state storage in MongoDB** — persist NextAuth CSRF tokens and any future OAuth state/codes in a dedicated collection with TTL indexes, replacing in-memory/cookie-only state
- Add **login audit logging** — record all login attempts (success and failure) in a MongoDB `login_audit` collection for visibility into suspicious activity
- Add **session hardening** — explicit JWT expiration, secure cookie flags enforcement, and session rotation on login
- Add **password policy enforcement** — minimum length increase to 8 characters, require mixed case and numbers on admin user creation/update

## Capabilities

### New Capabilities
- `login-rate-limiting`: Rate limiting for login attempts using MongoDB-backed counters with TTL expiry
- `login-audit-log`: Persistent audit trail of all authentication events (login success, failure, lockout)
- `auth-state-storage`: MongoDB-backed storage for OAuth state/CSRF tokens with TTL indexes

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Code**: `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/lib/mongodb.ts`, `src/app/actions/admin-users.ts`
- **Database**: Three new MongoDB collections: `login_attempts`, `login_audit`, `auth_states` (all with TTL indexes for automatic cleanup)
- **Dependencies**: No new npm packages required — uses existing MongoDB driver and next-auth capabilities
- **APIs**: No public API changes; all modifications are internal to the admin auth flow
