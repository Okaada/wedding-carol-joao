## 1. Configuration

- [x] 1.1 Add `NEXT_PUBLIC_RSVP_WHATSAPP` to `.env.example` with a commented placeholder value in E.164 format (e.g., `+5511999999999`) and a one-line note that the leading `+` is required
- [ ] 1.2 Set `NEXT_PUBLIC_RSVP_WHATSAPP` in the production deployment environment (Vercel/host dashboard) before merging; document the same in any internal deploy notes

## 2. WhatsApp URL helper

- [x] 2.1 Create `src/lib/rsvp-whatsapp.ts` exporting (a) `RSVP_WHATSAPP_MESSAGE` constant set to `"Olá! Gostaria de confirmar minha presença no casamento da Carol e do João. 💍"` and (b) a `getRsvpWhatsappUrl(): string` function that reads `process.env.NEXT_PUBLIC_RSVP_WHATSAPP`, validates it against `/^\+\d{8,15}$/`, throws a descriptive error if missing/invalid, strips the leading `+`, and returns `https://wa.me/<digits>?text=<encodeURIComponent(RSVP_WHATSAPP_MESSAGE)>`
- [x] 2.2 Make the validation run at module load so build/SSR fails fast when the env var is misconfigured (compute the URL once at the top of the module, then export it; throwing happens at import time)

## 3. CTA component

- [x] 3.1 Create `src/components/RsvpWhatsappCta.tsx` as a React Server Component (no `"use client"`) that imports the URL from `src/lib/rsvp-whatsapp.ts` and renders an `<a href={url} target="_blank" rel="noopener noreferrer">` styled as a primary button with the pt-BR label "Confirmar Presença pelo WhatsApp"
- [x] 3.2 Match the existing button styling used elsewhere on the site (primary background, white text, uppercase tracking) so it visually slots into the `#rsvp` section without ad-hoc CSS

## 4. Replace the form on the home page

- [x] 4.1 In `src/app/page.tsx`, remove the `import RsvpForm from "@/components/RsvpForm";` line and replace `<RsvpForm />` with `<RsvpWhatsappCta />` inside the existing `<section id="rsvp">`
- [x] 4.2 Update the supporting paragraph in the `#rsvp` section to reflect the new flow in pt-BR (e.g., "Clique no botão abaixo para confirmar sua presença com a gente pelo WhatsApp.")

## 5. Delete the form integration

- [x] 5.1 Delete `src/components/RsvpForm.tsx`
- [x] 5.2 Delete `src/app/actions/rsvp.ts`
- [x] 5.3 Run `grep -r "submitRsvp\|RsvpForm\|from \"@/app/actions/rsvp\"" src` and confirm no remaining references; remove any stragglers
- [x] 5.4 Confirm the admin surfaces (`src/app/admin/rsvp/page.tsx`, `src/app/api/rsvp/export/route.ts`, `src/components/admin/RsvpSearch.tsx`, the `/admin/rsvp` sidebar link in `AdminSidebar.tsx`) and `src/data/types.ts`'s `Rsvp` interface are left untouched

## 6. Verify

- [ ] 6.1 `npm run lint` and `npm run build` pass with `NEXT_PUBLIC_RSVP_WHATSAPP` set; build fails with a clear error when the env var is unset or malformed (`+abc`, `11999...`)
- [ ] 6.2 Start the dev server and visit `/`: confirm the `#rsvp` section shows the new CTA, the heading "Confirmar Presença" is unchanged, and no form inputs are present
- [ ] 6.3 Click the CTA and verify the link opens `https://wa.me/<digits>?text=...` in a new tab, with the pre-filled pt-BR message visible in the WhatsApp composer (or web.whatsapp.com when no app is installed)
- [ ] 6.4 Click "Confirmar Presença" in the Navbar from `/presentes` and confirm it navigates to `/#rsvp` and scrolls to the CTA section
- [ ] 6.5 Log in to `/admin/rsvp` and confirm the page still loads, lists historical entries, and the "Exportar CSV" link still produces a download
