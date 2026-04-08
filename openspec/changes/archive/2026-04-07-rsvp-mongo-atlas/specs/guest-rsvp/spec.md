## MODIFIED Requirements

### Requirement: RSVP submissions are persisted server-side
Each RSVP submission SHALL be inserted as a document into the `rsvps` collection of the `wedding` MongoDB Atlas database. The connection string MUST be supplied via the `MONGODB_URI` environment variable.

#### Scenario: Submission document format
- **WHEN** a valid RSVP is submitted
- **THEN** the persisted document MUST contain: `name` (string), `cellphone` (string), and `submittedAt` (ISO 8601 timestamp string)

#### Scenario: Multiple submissions are all stored
- **WHEN** multiple guests submit RSVPs
- **THEN** each submission MUST result in a separate document in the `rsvps` collection without overwriting previous entries

#### Scenario: Missing MONGODB_URI causes a clear failure
- **WHEN** the `MONGODB_URI` environment variable is not set
- **THEN** the server action MUST return an error and MUST NOT silently swallow the exception

## REMOVED Requirements

### Requirement: RSVP submissions are persisted to a local file
**Reason:** Replaced by MongoDB Atlas persistence — local file is lost on redeploy and unsafe for concurrent writes.
**Migration:** Manually insert any existing `data/rsvp.json` entries into the `wedding.rsvps` Atlas collection before switching over.
