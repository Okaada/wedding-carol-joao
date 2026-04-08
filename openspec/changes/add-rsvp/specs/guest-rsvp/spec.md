## ADDED Requirements

### Requirement: Guest can submit RSVP with name and cellphone
The system SHALL provide an RSVP form on the main page where a guest can enter their full name and cellphone number to confirm attendance.

#### Scenario: Guest submits valid RSVP
- **WHEN** a guest fills in a non-empty name and non-empty cellphone and submits the form
- **THEN** the submission MUST be persisted to `data/rsvp.json` (NDJSON format) and a Portuguese success message MUST be displayed to the guest

#### Scenario: Guest submits with empty name
- **WHEN** a guest submits the form with an empty name field
- **THEN** the system MUST display a validation error in Portuguese and MUST NOT persist the submission

#### Scenario: Guest submits with empty cellphone
- **WHEN** a guest submits the form with an empty cellphone field
- **THEN** the system MUST display a validation error in Portuguese and MUST NOT persist the submission

### Requirement: RSVP section is reachable from the Navbar
The Navbar SHALL include an anchor link labeled "Confirmar Presença" that scrolls to the RSVP section.

#### Scenario: Navbar link navigates to RSVP section
- **WHEN** a user clicks "Confirmar Presença" in the Navbar
- **THEN** the page MUST scroll to the RSVP form section

### Requirement: RSVP submissions are persisted server-side
Each RSVP submission SHALL be appended as a JSON object on its own line to `data/rsvp.json` at the project root.

#### Scenario: Submission record format
- **WHEN** a valid RSVP is submitted
- **THEN** the persisted record MUST contain: `name` (string), `cellphone` (string), and `submittedAt` (ISO 8601 timestamp)

#### Scenario: Multiple submissions do not corrupt the file
- **WHEN** multiple guests submit RSVPs
- **THEN** each submission MUST be appended without overwriting previous entries

### Requirement: All user-facing text is in Portuguese (pt-BR)
All labels, placeholders, buttons, success messages, and error messages in the RSVP form SHALL be written in Portuguese (pt-BR).

#### Scenario: Form labels are in Portuguese
- **WHEN** the RSVP section is rendered
- **THEN** the name field label MUST read "Nome completo", the cellphone field label MUST read "Celular", and the submit button MUST read "Confirmar Presença"

#### Scenario: Success message is in Portuguese
- **WHEN** a guest successfully submits the RSVP
- **THEN** the displayed message MUST be in Portuguese and confirm that the RSVP was received
