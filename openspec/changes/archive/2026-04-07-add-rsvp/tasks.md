## 1. Server Action

- [x] 1.1 Create `src/app/actions/rsvp.ts` with a Server Action that validates name and cellphone (both non-empty), appends a `{ name, cellphone, submittedAt }` NDJSON line to `data/rsvp.json`, and returns a typed result object (`{ success: boolean; error?: string }`)
- [x] 1.2 Add `data/rsvp.json` to `.gitignore`

## 2. RSVP Form Component

- [x] 2.1 Create `src/components/RsvpForm.tsx` as a `"use client"` component with fields "Nome completo" and "Celular", a submit button "Confirmar Presença", and inline validation error messages — all labels/messages in Portuguese (pt-BR)
- [x] 2.2 Wire the form to the server action using `useActionState` (or `useFormState`) to display the success message or server-side error after submission

## 3. Page Integration

- [x] 3.1 Add a `<section id="rsvp">` wrapping `<RsvpForm />` to `src/app/page.tsx`, positioned after `<PhotoGallery />`
- [x] 3.2 Add a "Confirmar Presença" anchor link (`href="#rsvp"`) to `src/components/Navbar.tsx`

## 4. Verify

- [x] 4.1 Submit the form with valid data and confirm `data/rsvp.json` contains the new NDJSON entry with correct fields
- [x] 4.2 Submit the form with missing name or cellphone and confirm validation errors appear in Portuguese without writing to the file
