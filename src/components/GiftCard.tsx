"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Gift } from "@/data/types";

export default function GiftCard({ gift }: { gift: Gift }) {
  const [status, setStatus] = useState(gift.status);
  const [showClaim, setShowClaim] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAvailable = status === "available";

  async function handleClaim() {
    if (!guestName.trim()) {
      setError("Por favor, informe seu nome.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch(`/api/gifts/${gift._id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: guestName.trim() }),
    });

    setLoading(false);
    if (res.ok) {
      setStatus("reserved");
      setShowClaim(false);
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao reservar presente.");
      if (res.status === 409) setStatus("reserved");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-accent bg-white">
      {gift.imageUrl && (
        <img
          src={gift.imageUrl}
          alt={gift.name}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-5">
        <h3 className="mb-1 font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground">
          {gift.name}
        </h3>
        {gift.description && (
          <p className="mb-3 text-sm text-muted">{gift.description}</p>
        )}
        <p className="mb-4 text-lg font-bold text-primary">
          {formatPrice(gift.price)}
        </p>

        {isAvailable ? (
          <>
            <div className="flex flex-col gap-2">
              {gift.externalUrl && (
                <a
                  href={gift.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Comprar no MercadoLivre
                </a>
              )}
              <button
                onClick={() => setShowClaim(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
              >
                Quero presentear
              </button>
            </div>

            {showClaim && (
              <div className="mt-3 space-y-2 rounded-lg bg-section-alt p-3">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-md border border-accent bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleClaim}
                    disabled={loading}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {loading ? "Reservando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => {
                      setShowClaim(false);
                      setError("");
                    }}
                    className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-section-alt px-4 py-2 text-center text-sm text-muted">
            Presente reservado
          </div>
        )}
      </div>
    </div>
  );
}
