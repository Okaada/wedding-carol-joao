# guest-rsvp Specification

## Purpose
TBD - created by archiving change rsvp-whatsapp-redirect. Update Purpose after archive.
## Requirements
### Requirement: Home-page RSVP section opens a WhatsApp conversation
The home page (`/`) SHALL render a section with `id="rsvp"` that contains a single primary call-to-action (CTA) which, when activated, opens a WhatsApp conversation with the couple. The CTA SHALL NOT submit any form data, write to any database, or call any internal API.

#### Scenario: Guest clicks the CTA on a device with WhatsApp installed
- **WHEN** a guest scrolls to the `#rsvp` section on the home page and clicks the "Confirmar Presença pelo WhatsApp" button
- **THEN** WhatsApp opens (mobile app or desktop) on a chat with the configured number, with the pre-filled pt-BR message already populated in the composer

#### Scenario: Guest clicks the CTA without WhatsApp installed
- **WHEN** a guest clicks the CTA on a device without the WhatsApp app
- **THEN** the browser navigates to `web.whatsapp.com` (via the `wa.me` redirect) so the guest can continue in WhatsApp Web

#### Scenario: CTA opens in a new tab
- **WHEN** the CTA is rendered as an anchor element
- **THEN** the anchor has `target="_blank"` and `rel="noopener noreferrer"` so the guest does not lose the wedding site context

### Requirement: WhatsApp deep link is built from configured number and pt-BR message
The CTA's `href` SHALL be the URL `https://wa.me/<digits>?text=<urlencoded-message>` where `<digits>` is the destination number from `NEXT_PUBLIC_RSVP_WHATSAPP` with any leading `+` removed, and `<urlencoded-message>` is the percent-encoded pt-BR confirmation message.

#### Scenario: Number is provided in E.164 format
- **WHEN** `NEXT_PUBLIC_RSVP_WHATSAPP` is set to `+5511999999999`
- **THEN** the rendered anchor's `href` starts with `https://wa.me/5511999999999?text=`

#### Scenario: Pre-filled message is the canonical pt-BR text
- **WHEN** the CTA is rendered
- **THEN** the `text` query parameter decodes to exactly `Olá! Gostaria de confirmar minha presença no casamento da Carol e do João. 💍`

#### Scenario: Special characters in the message are percent-encoded
- **WHEN** the message contains spaces, accents (`á`, `ã`, `ç`), an exclamation mark, and an emoji (💍)
- **THEN** each character is percent-encoded per RFC 3986 (e.g., space → `%20`, `ã` → `%C3%A3`) so WhatsApp parses the `text` parameter correctly

### Requirement: Missing or malformed WhatsApp number fails the build/SSR
If `NEXT_PUBLIC_RSVP_WHATSAPP` is unset, empty, or does not match the pattern `^\+\d{8,15}$`, the application SHALL throw a descriptive error at module load time so the failure is caught during build or initial render, never silently shipping a broken link to guests.

#### Scenario: Env var is unset in production build
- **WHEN** the production build runs without `NEXT_PUBLIC_RSVP_WHATSAPP` defined
- **THEN** the build fails with an error message identifying the missing env var and the expected E.164 format

#### Scenario: Env var has wrong format
- **WHEN** `NEXT_PUBLIC_RSVP_WHATSAPP` is set to `11999999999` (no `+` prefix) or `+abc`
- **THEN** the application throws an error referencing the expected pattern `^\+\d{8,15}$` rather than rendering a broken `wa.me/abc` link

### Requirement: No form, no database write
The home page SHALL NOT contain any RSVP form fields (name, cellphone, etc.). Submitting the RSVP CTA SHALL NOT trigger any HTTP request to the site backend or any write to the `carol-joao.rsvp` MongoDB collection.

#### Scenario: No form inputs in the RSVP section
- **WHEN** the home page is rendered
- **THEN** the `#rsvp` section contains no `<form>`, `<input>`, `<textarea>`, or `<select>` elements related to RSVP

#### Scenario: No server action exists for RSVP submissions
- **WHEN** the codebase is inspected
- **THEN** there is no exported `submitRsvp` server action and no client-side code that POSTs RSVP data anywhere

### Requirement: All RSVP-section copy is in Portuguese (pt-BR)
Every user-visible string in the `#rsvp` section — heading, supporting paragraph, CTA label, and any helper text — SHALL be in Brazilian Portuguese, consistent with the rest of the site.

#### Scenario: Section heading and CTA label are in pt-BR
- **WHEN** the `#rsvp` section is rendered
- **THEN** the heading reads "Confirmar Presença", the CTA button label references WhatsApp in pt-BR (e.g., "Confirmar pelo WhatsApp" or "Confirmar Presença pelo WhatsApp"), and any supporting paragraph is also written in pt-BR

### Requirement: Navbar anchor to the RSVP section is preserved
The shared site Navbar SHALL continue to expose a "Confirmar Presença" link pointing to `#rsvp` on the home page, so existing guests with the link bookmarked or shared still land on the new CTA section.

#### Scenario: Clicking the Navbar entry scrolls to the new CTA
- **WHEN** a guest clicks "Confirmar Presença" in the Navbar from any page
- **THEN** the browser navigates to `/#rsvp` and scrolls to the section that now contains the WhatsApp CTA

