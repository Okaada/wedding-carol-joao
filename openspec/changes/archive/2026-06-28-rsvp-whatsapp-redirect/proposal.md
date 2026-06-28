## Why

Carol & João prefer to handle RSVPs through a personal WhatsApp conversation instead of a silent form submission. Talking directly with guests is warmer, lets the couple ask follow-up questions (number of guests, dietary needs, etc.), and removes the operational burden of curating a separate guest-confirmation database on the public site.

## What Changes

- **BREAKING**: The `#rsvp` section on the home page no longer renders a name/cellphone form that writes to MongoDB. It now renders a single CTA button that opens a WhatsApp chat with the couple, with a pre-filled pt-BR message.
- Pre-filled message (Portuguese, pt-BR): `Olá! Gostaria de confirmar minha presença no casamento da Carol e do João. 💍`
- The destination WhatsApp number is read from a public env var `NEXT_PUBLIC_RSVP_WHATSAPP` (E.164 format, e.g. `+5511999999999`). If the env var is missing in production, the build SHALL fail loudly rather than rendering a broken link.
- The `submitRsvp` Server Action and the `RsvpForm` client component are deleted. New form submissions no longer hit the `carol-joao.rsvp` MongoDB collection.
- The Navbar `#rsvp` anchor link is preserved (label "Confirmar Presença") — only the section content changes.
- The admin RSVP area (`/admin/rsvp` page, `/api/rsvp/export` CSV route, sidebar link, `rsvp` Mongo collection) is **kept as read-only**, so the couple can still see and export entries that were submitted before this change. No new writes occur after the cutover.
- All user-facing copy stays in Portuguese (pt-BR).

## Capabilities

### New Capabilities
- `guest-rsvp`: Home-page section that lets a guest confirm presence by opening a WhatsApp conversation with the couple, pre-filled with a pt-BR confirmation message.

### Modified Capabilities
<!-- No requirement-level changes to existing specs. The site-navigation spec still applies: the `#rsvp` anchor stays in the Navbar, only the target section's content changes. The admin RSVP view has no existing spec to amend. -->

## Impact

- `src/components/RsvpForm.tsx` — **DELETED**.
- `src/app/actions/rsvp.ts` — **DELETED** (server action no longer needed).
- `src/app/page.tsx` — Replace `<RsvpForm />` inside `#rsvp` with a new `<RsvpWhatsappCta />` component; update the section copy to reflect the new flow.
- `src/components/RsvpWhatsappCta.tsx` — **NEW** client/server component rendering the WhatsApp deep-link button.
- `src/lib/rsvp-whatsapp.ts` — **NEW** small helper to build the `https://wa.me/<number>?text=<encoded>` URL and validate the env var.
- `src/components/Navbar.tsx` — No change (anchor `#rsvp` retained).
- `.env.example` / deployment docs — Add `NEXT_PUBLIC_RSVP_WHATSAPP` with the expected E.164 format.
- Admin surfaces (`src/app/admin/rsvp/page.tsx`, `src/app/api/rsvp/export/route.ts`, `src/components/admin/RsvpSearch.tsx`, `src/components/admin/AdminSidebar.tsx` link) — **unchanged**, read-only access to historical entries.
- MongoDB `carol-joao.rsvp` collection — no schema change; receives no new documents.
