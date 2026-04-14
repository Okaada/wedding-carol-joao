## ADDED Requirements

### Requirement: Construction banner displays friendly message
The homepage SHALL display a small banner with a friendly message indicating the site is under construction.

#### Scenario: Guest visits the homepage
- **WHEN** a guest opens the homepage for the first time in a session
- **THEN** a banner appears at the top of the page with the message "Nosso site ainda está sendo preparado com carinho! Algumas informações podem mudar."
- **AND** the banner uses the site's accent color palette

### Requirement: Banner is dismissible
The banner SHALL include a close button that hides it for the current session.

#### Scenario: Guest dismisses the banner
- **WHEN** a guest clicks the close button on the banner
- **THEN** the banner disappears
- **AND** it remains hidden for the rest of the browser session (sessionStorage)

#### Scenario: Guest returns in a new session
- **WHEN** a guest opens a new browser tab/session
- **THEN** the banner appears again
