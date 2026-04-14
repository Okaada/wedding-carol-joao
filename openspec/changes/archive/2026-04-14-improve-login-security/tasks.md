## 1. Database Setup

- [x] 1.1 Create MongoDB helper to ensure TTL indexes exist for `login_attempts` (15min), `login_audit` (90 days), and `auth_states` (10min) collections — call on app init
- [x] 1.2 Add email normalization utility function (lowercase + trim) in `src/lib/auth-utils.ts`

## 2. Login Rate Limiting

- [x] 2.1 Create `checkRateLimit(email)` function that queries `login_attempts` by normalized email and returns whether the user is locked out
- [x] 2.2 Create `recordFailedAttempt(email)` function that upserts the attempt counter with `$inc` and sets `firstAttempt` on insert
- [x] 2.3 Create `clearAttempts(email)` function that deletes the attempt document on successful login
- [x] 2.4 Integrate rate limiting into the `authorize()` callback in `src/lib/auth.ts` — check lockout before password verification, record failures, clear on success

## 3. Login Audit Logging

- [x] 3.1 Create `logAuthEvent(email, action, ip, userAgent)` function that inserts into `login_audit` collection
- [x] 3.2 Integrate audit logging into `authorize()` — log `login_success`, `login_failure`, and `login_lockout` events with request metadata

## 4. Auth State Storage

- [x] 4.1 Create `storeAuthState(token)` and `validateAuthState(token)` functions for MongoDB-backed CSRF state management
- [x] 4.2 Wire auth state storage into next-auth configuration using custom callbacks or events

## 5. Session Hardening

- [x] 5.1 Configure explicit `jwt.maxAge` of 24 hours in next-auth options
- [x] 5.2 Configure secure cookie settings (`httpOnly`, `secure`, `sameSite: "strict"`) for production in next-auth cookie options

## 6. Password Policy

- [x] 6.1 Create `validatePassword(password)` function enforcing min 8 chars, uppercase, lowercase, and digit
- [x] 6.2 Integrate password validation into `createAdminUser` server action in `src/app/actions/admin-users.ts` with Portuguese error message

## 7. Testing & Verification

- [x] 7.1 Verify rate limiting by attempting 6 logins with wrong password and confirming lockout on the 6th
- [x] 7.2 Verify audit log entries are created in MongoDB for success, failure, and lockout events
- [x] 7.3 Verify password policy rejects weak passwords and accepts strong ones
- [x] 7.4 Verify TTL indexes are created on all three collections
