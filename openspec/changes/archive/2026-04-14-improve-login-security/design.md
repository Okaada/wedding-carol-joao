## Context

The admin panel at `/admin` is protected by next-auth v5 with a credentials-only provider. Authentication uses bcryptjs (12 rounds) with JWT sessions. MongoDB is already connected (`src/lib/mongodb.ts`) with a cached client pattern. There is no rate limiting on login, no audit trail, and CSRF/OAuth state is handled entirely via cookies by next-auth defaults.

The application is a wedding website deployed on Vercel, with a small number of admin users (1-3). The threat model is primarily brute-force login attacks and lack of visibility into authentication events.

## Goals / Non-Goals

**Goals:**
- Prevent brute-force attacks by rate limiting login attempts per email, backed by MongoDB with TTL auto-expiry
- Persist OAuth/CSRF state tokens in MongoDB for server-side validation instead of relying solely on cookie-based state
- Create an audit log of all login events for security visibility
- Harden session configuration (explicit expiry, secure cookies)
- Enforce stronger password policies on admin user creation

**Non-Goals:**
- Adding OAuth providers (Google, GitHub, etc.) — out of scope for this change
- Two-factor authentication (2FA/MFA) — future enhancement
- IP-based blocking or geo-fencing
- Admin user roles/permissions system
- Rate limiting on non-auth endpoints

## Decisions

### 1. MongoDB for rate limiting state (not in-memory)

**Choice**: Store login attempt counters in a `login_attempts` collection with TTL indexes.

**Rationale**: The app runs on Vercel (serverless), so in-memory stores like `Map` or `node-cache` don't persist across function invocations. MongoDB is already connected and TTL indexes handle automatic cleanup without cron jobs.

**Alternatives considered**:
- Redis/Upstash — adds a new dependency for a small app with few admin users
- Cookie-based counters — trivially bypassable by clearing cookies

**Design**: Documents keyed by email with `count`, `firstAttempt` timestamp. TTL index expires documents after 15 minutes. Lockout threshold: 5 failed attempts → 15-minute lockout.

### 2. MongoDB adapter for next-auth state storage

**Choice**: Create a custom `auth_states` collection to store CSRF tokens and OAuth state with TTL expiry.

**Rationale**: Cookie-only CSRF state is vulnerable to cookie manipulation. Storing state server-side in MongoDB allows validation against a trusted source. TTL index (10 minutes) ensures automatic cleanup.

**Alternatives considered**:
- next-auth database adapter (full) — overkill; we only need state storage, not full session/user management in DB
- Signed cookies with HMAC — still client-side; server-side is stronger

### 3. Audit log as a separate collection

**Choice**: `login_audit` collection with capped or TTL-based retention.

**Rationale**: Separating audit from business data keeps queries fast and allows independent retention policies. TTL of 90 days keeps the collection manageable.

**Design**: Each document records `email`, `action` (login_success, login_failure, lockout), `ip`, `userAgent`, `timestamp`.

### 4. Password policy at the application layer

**Choice**: Enforce minimum 8 characters, at least one uppercase, one lowercase, and one digit — validated in the `createAdminUser` and password update server actions.

**Rationale**: The current 6-character minimum is weak. Application-layer validation gives clear error messages in Portuguese. No need for a library — a simple regex check suffices.

## Risks / Trade-offs

- **[MongoDB TTL precision]** TTL indexes run every 60 seconds, so lockout expiry may lag by up to 60s → Acceptable for this use case; not a real-time system.
- **[Rate limit bypass via email variants]** Attacker could try `admin+1@...` → Mitigated by normalizing email (lowercase, trim) before lookup.
- **[Audit log growth]** High-volume attacks could bloat the collection → TTL index at 90 days + document size is small (~500 bytes).
- **[Serverless cold starts]** First login after cold start has MongoDB connection latency → Already the case for all admin operations; no regression.
