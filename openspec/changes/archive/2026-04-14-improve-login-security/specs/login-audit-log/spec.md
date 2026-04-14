## ADDED Requirements

### Requirement: Log all authentication events
The system SHALL record every login attempt in a MongoDB `login_audit` collection with the following fields: `email`, `action` (one of: `login_success`, `login_failure`, `login_lockout`), `timestamp`, `ip` (from request headers), and `userAgent`.

#### Scenario: Successful login is logged
- **WHEN** a user logs in successfully
- **THEN** the system creates a document in `login_audit` with `action: "login_success"` and the user's email, IP, user agent, and current timestamp

#### Scenario: Failed login is logged
- **WHEN** a user submits invalid credentials
- **THEN** the system creates a document in `login_audit` with `action: "login_failure"` and the submitted email, IP, user agent, and current timestamp

#### Scenario: Lockout event is logged
- **WHEN** a user is blocked by rate limiting
- **THEN** the system creates a document in `login_audit` with `action: "login_lockout"` and the submitted email, IP, user agent, and current timestamp

### Requirement: Audit log automatic retention
The system SHALL configure a TTL index on the `login_audit` collection that automatically deletes documents older than 90 days.

#### Scenario: Old audit entries are cleaned up
- **WHEN** a `login_audit` document's `timestamp` is older than 90 days
- **THEN** MongoDB's TTL index removes the document automatically
