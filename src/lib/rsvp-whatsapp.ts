export const RSVP_WHATSAPP_MESSAGE =
  "Olá! Tudo bem? Gostaria de confirmar minha presença no casamento da Carol e do João.";

function buildRsvpWhatsappUrl(): string {
  const raw = process.env.NEXT_PUBLIC_RSVP_WHATSAPP;

  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_RSVP_WHATSAPP is not set. Configure it with a WhatsApp number in E.164 format (e.g., +5511999999999).",
    );
  }

  if (!/^\+\d{8,15}$/.test(raw)) {
    throw new Error(
      `NEXT_PUBLIC_RSVP_WHATSAPP="${raw}" is malformed. Expected E.164 format matching /^\\+\\d{8,15}$/ (e.g., +5511999999999).`,
    );
  }

  const digits = raw.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(RSVP_WHATSAPP_MESSAGE)}`;
}

export const RSVP_WHATSAPP_URL = buildRsvpWhatsappUrl();

export function getRsvpWhatsappUrl(): string {
  return RSVP_WHATSAPP_URL;
}
