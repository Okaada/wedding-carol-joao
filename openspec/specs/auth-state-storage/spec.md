## ADDED Requirements

### Requirement: Store CSRF and OAuth state in MongoDB
The system SHALL persist CSRF tokens and OAuth state parameters in a MongoDB `auth_states` collection instead of relying solely on cookie-based state. Each state document SHALL include `token`, `createdAt`, and an optional `callbackUrl`.

#### Scenario: CSRF token is stored on login page load
- **WHEN** the login page is rendered and next-auth generates a CSRF token
- **THEN** the system stores the token in `auth_states` with a `createdAt` timestamp

#### Scenario: CSRF token is validated on login submission
- **WHEN** a login form is submitted with a CSRF token
- **THEN** the system verifies the token exists in `auth_states` before processing the credentials

#### Scenario: Invalid CSRF token is rejected
- **WHEN** a login form is submitted with a CSRF token that does not exist in `auth_states`
- **THEN** the system rejects the request

### Requirement: Auth state automatic expiry
The system SHALL configure a TTL index on the `auth_states` collection that automatically deletes documents older than 10 minutes.

#### Scenario: Expired state tokens are cleaned up
- **WHEN** an `auth_states` document's `createdAt` is older than 10 minutes
- **THEN** MongoDB's TTL index removes the document automatically

### Requirement: Session hardening configuration
The system SHALL configure next-auth with explicit JWT maxAge of 24 hours and enforce secure cookie settings (httpOnly, sameSite strict) in production.

#### Scenario: Session expires after 24 hours
- **WHEN** a user logged in more than 24 hours ago
- **THEN** the JWT token is considered expired and the user MUST re-authenticate

#### Scenario: Cookies use secure flags in production
- **WHEN** the application is running in production (NODE_ENV=production)
- **THEN** session cookies SHALL have `httpOnly: true`, `secure: true`, and `sameSite: "strict"`
