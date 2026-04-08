## Why

The wedding website currently has no way for invited guests to confirm their attendance. A simple RSVP form lets Carol & João know who is coming, collecting the guest's name and cellphone number for follow-up.

## What Changes

- Add a new **RSVP section** to the main page with a form (name + cellphone)
- Add a Next.js **Server Action** (or API route) to receive and persist RSVP submissions
- Store submissions in a **JSON file** on disk (`data/rsvp.json`) — simple and sufficient for a small guest list
- Add the RSVP section link to the **Navbar**
- All user-facing labels and messages in **Portuguese (pt-BR)**

## Capabilities

### New Capabilities
- `guest-rsvp`: Form that collects guest name and cellphone, submits via server action, and stores to a JSON file on the server

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `src/components/RsvpForm.tsx` — new RSVP form component
- `src/app/actions/rsvp.ts` — new server action to handle form submission and file persistence
- `src/app/page.tsx` — import and render `<RsvpForm />` section
- `src/components/Navbar.tsx` — add "RSVP" anchor link
- `data/rsvp.json` — new file created at runtime to persist submissions (gitignored)
