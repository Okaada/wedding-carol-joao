# secure-csv-export Specification

## Purpose
TBD - created by archiving change harden-export-headers-auth. Update Purpose after archive.
## Requirements
### Requirement: CSV serialization neutralizes formula injection
The shared CSV serializer SHALL neutralize spreadsheet formula injection in addition to RFC 4180 escaping. Before quoting, any cell value (header or row) that begins with `=`, `+`, `-`, `@`, a TAB character, or a carriage return SHALL be prefixed with a single quote (`'`) so spreadsheet applications treat it as literal text rather than a formula. This SHALL apply to every consumer of the serializer, including the RSVP export.

#### Scenario: Formula-leading value is neutralized
- **WHEN** a CSV cell value is `=HYPERLINK("http://evil","click")`
- **THEN** the serialized output for that cell begins with `'=HYPERLINK(...)` so the spreadsheet renders it as text

#### Scenario: Command-style value is neutralized
- **WHEN** an exported RSVP `name` or `cellphone` begins with `@`, `+`, `-`, TAB, or CR
- **THEN** the serialized cell is prefixed with `'`

#### Scenario: Ordinary values are unchanged
- **WHEN** a cell value does not begin with a formula-trigger character
- **THEN** the value is serialized using only the existing RFC 4180 quote/comma/newline escaping, with no leading quote added

#### Scenario: RFC escaping still applies after neutralization
- **WHEN** a neutralized value also contains a comma, double-quote, or newline
- **THEN** the value is additionally wrapped in double quotes with embedded quotes doubled, as before

