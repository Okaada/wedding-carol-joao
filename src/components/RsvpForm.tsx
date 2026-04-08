"use client";

import { useActionState } from "react";
import { submitRsvp, type RsvpResult } from "@/app/actions/rsvp";

const initialState: RsvpResult = { success: false };

export default function RsvpForm() {
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);

  if (state.success) {
    return (
      <p className="text-center text-lg text-primary font-[family-name:var(--font-playfair)]">
        Presença confirmada! Mal podemos esperar para celebrar com você. 🎉
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rsvp-name" className="text-sm tracking-widest uppercase text-muted">
          Nome completo
        </label>
        <input
          id="rsvp-name"
          name="name"
          type="text"
          required
          placeholder="Seu nome completo"
          className="rounded border border-muted/30 bg-background px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rsvp-cellphone" className="text-sm tracking-widest uppercase text-muted">
          Celular
        </label>
        <input
          id="rsvp-cellphone"
          name="cellphone"
          type="tel"
          required
          placeholder="(11) 99999-9999"
          className="rounded border border-muted/30 bg-background px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-primary px-8 py-3 text-sm tracking-widest uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Confirmar Presença"}
      </button>
    </form>
  );
}
