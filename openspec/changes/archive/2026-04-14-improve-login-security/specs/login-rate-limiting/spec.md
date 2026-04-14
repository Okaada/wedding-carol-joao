## ADDED Requirements

### Requirement: Rate limit failed login attempts
The system SHALL track failed login attempts per email address in a MongoDB `login_attempts` collection. After 5 failed attempts within a 15-minute window, the system SHALL reject further login attempts for that email with a lockout message ("Muitas tentativas de login. Tente novamente em 15 minutos.") without checking the password.

#### Scenario: Failed attempt increments counter
- **WHEN** a user submits invalid credentials for an email
- **THEN** the system increments the attempt counter for that email in `login_attempts` and returns the standard "Email ou senha incorretos" error

#### Scenario: Lockout after 5 failures
- **WHEN** a user has 5 failed login attempts within 15 minutes and submits another login attempt
- **THEN** the system rejects the attempt immediately with "Muitas tentativas de login. Tente novamente em 15 minutos." without verifying the password

#### Scenario: Lockout expires automatically
- **WHEN** 15 minutes have passed since the first failed attempt in a lockout window
- **THEN** the MongoDB TTL index removes the document and the user can attempt login again

#### Scenario: Successful login resets counter
- **WHEN** a user logs in successfully
- **THEN** the system deletes the attempt counter document for that email

### Requirement: Normalize email before rate limit lookup
The system SHALL normalize the email address (lowercase, trimmed) before checking or updating rate limit counters to prevent bypass via case or whitespace variations.

#### Scenario: Case-variant email is treated as same identity
- **WHEN** a user fails login with "Admin@Example.com" and then tries "admin@example.com"
- **THEN** both attempts count toward the same rate limit counter

### Requirement: Password policy enforcement
The system SHALL enforce that admin passwords are at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit. This validation SHALL apply to `createAdminUser` and any password update operations.

#### Scenario: Weak password rejected on user creation
- **WHEN** an admin creates a new user with password "abc123"
- **THEN** the system rejects the request with "A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula e número."

#### Scenario: Strong password accepted
- **WHEN** an admin creates a new user with password "SecurePass1"
- **THEN** the system accepts the password and proceeds with user creation
