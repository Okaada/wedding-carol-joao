import { RSVP_WHATSAPP_URL } from "@/lib/rsvp-whatsapp";

export default function RsvpWhatsappCta() {
  return (
    <a
      href={RSVP_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded bg-primary px-8 py-3 text-sm tracking-widest uppercase text-white transition-opacity hover:opacity-90"
    >
      Confirmar Presença pelo WhatsApp
    </a>
  );
}
