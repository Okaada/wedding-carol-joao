## Context

The current RSVP flow is a Next.js Server Action backed by MongoDB (`carol-joao.rsvp`). Guests fill a form with name + cellphone, and submissions are written via `submitRsvp` (`src/app/actions/rsvp.ts`) and displayed in `/admin/rsvp`. Carol & João decided that confirmations are easier to manage as direct WhatsApp conversations — they want to talk to each guest, ask follow-up questions, and avoid maintaining a parallel guest list inside the site.

The Navbar already exposes a `Confirmar Presença` anchor pointing at `#rsvp`, and the home page reserves a dedicated section for it. The intent is to keep that section intact visually but swap its content from a form to a single WhatsApp CTA.

## Goals / Non-Goals

**Goals:**
- Replace the home-page RSVP form with a WhatsApp deep-link CTA, pre-filling a pt-BR message.
- Delete the `submitRsvp` server action, `RsvpForm` component, and any code path that writes to `carol-joao.rsvp`.
- Make the WhatsApp number configurable via env var (no hardcoded number in source) so the couple can swap it without a code change.
- Keep the existing `/admin/rsvp` read-only surface so historic entries remain searchable/exportable.
- Preserve the Navbar anchor `#rsvp` and the section's id, so existing deep links keep working.

**Non-Goals:**
- Migrating or deleting historic data from `carol-joao.rsvp`.
- Building a WhatsApp Business API integration (webhook, message templates, status updates). This change is a static `https://wa.me/...` deep link.
- Tracking analytics on CTA clicks.
- Internationalization beyond pt-BR.
- Removing the admin RSVP page or sidebar entry.

## Decisions

### 1. Use the public `wa.me` deep-link scheme
**Decision:** Build URLs of the form `https://wa.me/<digits>?text=<encoded message>`, where `<digits>` is the E.164 number with the leading `+` stripped (WhatsApp's expected format).

**Rationale:** `wa.me` is WhatsApp's official, universal short link — it works on iOS, Android, and desktop browsers, falling back to web WhatsApp when the app is not installed. No SDK or API key required. The `text=` query parameter pre-fills the chat composer.

**Alternative considered:** `whatsapp://send?phone=...` — rejected because it only works when the app handler is registered; on desktop browsers without the app it produces an unhandled-scheme error.

**Alternative considered:** WhatsApp Business Cloud API + click-to-chat link — rejected as massive overkill for a one-off wedding site.

### 2. Read the destination number from `NEXT_PUBLIC_RSVP_WHATSAPP`
**Decision:** Expose the number through a `NEXT_PUBLIC_*` env var so it is inlined into the client bundle at build time. Validate it at module load — if missing or not matching `^\+\d{8,15}$`, throw during build/SSR.

**Rationale:** Keeping the number out of source lets Carol & João rotate it without a code change. Failing loudly when unset prevents shipping a broken `tel:`/`wa.me` link to production.

**Alternative considered:** Hardcode the number in `src/data/couple.ts` — rejected; this conflates copy with secrets-like config and forces a redeploy for any change.

**Alternative considered:** Server-only env var + fetch through an API route — rejected; introduces a runtime round-trip for a value that is public anyway (anyone who clicks the link sees the number).

### 3. Pre-filled message is a single source-of-truth constant
**Decision:** Store the pt-BR message text as a single exported constant in `src/lib/rsvp-whatsapp.ts`. The CTA component imports it.

**Rationale:** Tweaking the message (e.g., adding emojis, mentioning the date) becomes a one-line change. Keeps the URL builder pure and testable.

### 4. Hard-delete the form path, keep the admin surface
**Decision:** Remove `RsvpForm.tsx` and `actions/rsvp.ts` entirely (no feature flag, no "/legacy" fallback). Leave `/admin/rsvp`, `/api/rsvp/export`, sidebar entry, and the Mongo `rsvp` collection untouched.

**Rationale:** The user explicitly asked to "completely remove the integration of RSVP through the form" while keeping admin read-only. A feature flag would just add dead code on a site that ships infrequently and has no rollback drill. The admin page still works because it only reads from Mongo — no writer is required for reads.

### 5. CTA is a server component rendering an anchor
**Decision:** `RsvpWhatsappCta` is a React Server Component that calls the URL builder at render time and outputs `<a href="..." target="_blank" rel="noopener noreferrer">`. No client-side JS, no `"use client"`.

**Rationale:** The URL is fully knowable at build time. A plain anchor is the most accessible primitive (right-click "open in new tab", middle-click, copy link all work natively). No hydration cost.

## Risks / Trade-offs

- **[Env var missing in production]** → Mitigation: throw on import in `src/lib/rsvp-whatsapp.ts` so the build/SSR fails fast. Document `NEXT_PUBLIC_RSVP_WHATSAPP` in `.env.example` and the deployment runbook.
- **[Wrong number format silently produces a broken link]** → Mitigation: regex-validate `^\+\d{8,15}$` at module load; reject anything else with a descriptive error.
- **[Pre-filled message looks generic when many guests send the same text]** → Accepted. Carol & João can reply asking for guest count/name; the goal is to start a conversation, not collect structured data.
- **[Historical Mongo entries become stale and partially duplicate WhatsApp confirmations]** → Accepted. Admin page is read-only; couple will mentally merge the two lists. No automated migration.
- **[`wa.me` link doesn't always open the desktop app]** → Mitigation: WhatsApp Web is an acceptable fallback; users see a QR code if not logged in. No action needed.

## Migration Plan

1. Set `NEXT_PUBLIC_RSVP_WHATSAPP` in the production environment (Vercel/host of choice) before merging — required at build time.
2. Merge & deploy. New visitors see the CTA; existing `#rsvp` deep links still scroll to the same section.
3. No DB migration. Old documents in `carol-joao.rsvp` remain accessible via `/admin/rsvp`.
4. **Rollback:** revert the commit. `submitRsvp` and `RsvpForm` come back, writes resume to the same Mongo collection. No data shape changes were made, so old writes and new writes coexist.

## Open Questions

- Should the admin sidebar label change from "Confirmações" to "Confirmações (legado)" to signal it is now read-only? Deferred — purely cosmetic, can ship as a follow-up.
