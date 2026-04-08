## Context

The wedding website is a Next.js 14+ App Router application with no backend or database. Guest list is small (tens to low hundreds). The site needs a lightweight way to capture RSVP confirmations — name and cellphone — without introducing a full database or external service.

## Goals / Non-Goals

**Goals:**
- Add a visible RSVP section to the main page with a Portuguese-language form (name + cellphone)
- Persist submissions server-side via a Next.js Server Action writing to a local JSON file
- Show success/error feedback to the guest after submitting
- Add an RSVP anchor link in the Navbar

**Non-Goals:**
- Guest list management UI or admin dashboard
- Email/SMS confirmation to guests
- Duplicate submission prevention beyond basic UX
- Payment integration (MercadoPago deferred to a future change)
- Authentication or invite code validation

## Decisions

### 1. Server Action + local JSON file for persistence
**Decision:** Use a Next.js Server Action that appends each submission to `data/rsvp.json` at the project root.

**Rationale:** Zero infrastructure needed. For a wedding guest list (< 200 people), a JSON file is perfectly adequate and easy to read/export. No database setup, no third-party service, no env vars required.

**Alternative considered:** Supabase / PlanetScale — rejected for added complexity and operational overhead for a one-time event site.

**Alternative considered:** Email via Resend/SendGrid — rejected as primary storage; may be added later as a notification layer.

### 2. `data/rsvp.json` is gitignored
**Decision:** The submissions file lives at `data/rsvp.json` (project root, gitignored).

**Rationale:** Keeps guest PII out of version control. Carol & João retrieve submissions by SSHing to the host or via a future admin view.

### 3. Client-side form with Server Action (no separate API route)
**Decision:** Use React `<form action={serverAction}>` with `useFormState` / `useActionState` for feedback.

**Rationale:** Native Next.js App Router pattern — no need for `fetch` boilerplate or a separate `/api/rsvp` route. Progressive enhancement works without JS.

### 4. Cellphone field: free-text with minimal validation
**Decision:** Accept any non-empty string for cellphone. No strict regex enforcement.

**Rationale:** Brazilian phone formats vary (with/without country code, spaces, dashes). Strict validation would cause friction. The field is for contact, not verification.

## Risks / Trade-offs

- **[Concurrent writes]** → Multiple simultaneous submissions could corrupt `rsvp.json`. Mitigation: use `fs.appendFileSync` with newline-delimited JSON (NDJSON) to avoid read-modify-write race conditions.
- **[Data loss on deploy]** → If the host redeploys and wipes the filesystem, `rsvp.json` is lost. Mitigation: document that the file must be backed up before redeployment; consider a periodic backup script.
- **[No duplicate prevention]** → Same person can submit multiple times. Acceptable for this event size; hosts can deduplicate manually.
