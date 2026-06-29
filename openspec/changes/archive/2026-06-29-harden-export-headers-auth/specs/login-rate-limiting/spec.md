## MODIFIED Requirements

### Requirement: Rate limit failed login attempts
The system SHALL track failed login attempts in a MongoDB `login_attempts` collection, keyed by BOTH normalized email AND client IP. After 5 failed attempts within a 15-minute window, the system SHALL reject further login attempts with a lockout message ("Muitas tentativas de login. Tente novamente em 15 minutos.") without checking the password. To prevent a third party from locking a legitimate user out by targeting their email alone, the system SHALL NOT lock a login attempt solely because the email counter is high when the request originates from an IP that has not itself exceeded the threshold; brute-force traffic concentrated on a single IP SHALL still be throttled.

#### Scenario: Failed attempt increments counters
- **WHEN** a user submits invalid credentials for an email
- **THEN** the system increments the attempt counters for both that email and the originating IP in `login_attempts` and returns the standard "Email ou senha incorretos" error

#### Scenario: Lockout after 5 failures from the same IP
- **WHEN** a single IP accumulates 5 failed login attempts within 15 minutes and submits another login attempt
- **THEN** the system rejects the attempt immediately with "Muitas tentativas de login. Tente novamente em 15 minutos." without verifying the password

#### Scenario: Email-targeted attempts from foreign IPs do not lock the real user
- **WHEN** an attacker triggers 5 failures against a known admin email from IPs the legitimate user does not use
- **AND** the legitimate user then logs in with correct credentials from their own (non-throttled) IP
- **THEN** the system does not reject the legitimate login on the basis of the email counter alone

#### Scenario: Lockout expires automatically
- **WHEN** 15 minutes have passed since the first failed attempt in a lockout window
- **THEN** the MongoDB TTL index removes the document and the affected key can attempt login again

#### Scenario: Successful login resets the email counter
- **WHEN** a user logs in successfully
- **THEN** the system deletes the attempt counter document for that email

### Requirement: Normalize email before rate limit lookup
The system SHALL normalize the email address (lowercase, trimmed) before checking or updating rate limit counters to prevent bypass via case or whitespace variations. The system SHALL additionally make the authentication response time independent of whether the submitted email exists: when no matching user is found, the system SHALL perform a dummy `bcrypt.compare` against a fixed hash so the response latency matches the path taken for a valid email with a wrong password.

#### Scenario: Case-variant email is treated as same identity
- **WHEN** a user fails login with "Admin@Example.com" and then tries "admin@example.com"
- **THEN** both attempts count toward the same rate limit counter

#### Scenario: Unknown email does not leak via timing
- **WHEN** a login is attempted with an email that has no matching admin user
- **THEN** the system performs a dummy password comparison so the response time is comparable to a valid email with an incorrect password
- **AND** the error returned is the standard "Email ou senha incorretos" message
