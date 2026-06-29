"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import ClaimModal from "@/components/ClaimModal";
import type { PublicGift, BuyerInfo } from "@/data/types";

interface GiftCardProps {
  gift: PublicGift;
  pixQrCodeUrl?: string;
  pixPayload?: string;
}

export default function GiftCard({ gift, pixQrCodeUrl, pixPayload }: GiftCardProps) {
  const [status, setStatus] = useState(gift.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const multiPurchase = gift.singlePurchase !== true;
  const isAvailable = multiPurchase || status === "available";
  const purchaseMode = gift.purchaseMode ?? "mercadopago";

  async function handleClaim(buyerInfo: BuyerInfo) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/gifts/${gift._id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buyerInfo),
      });

      if (res.ok) {
        if (!multiPurchase) setStatus("claimed");
        setShowModal(false);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao reservar presente.");
        if (res.status === 409 && !multiPurchase) setStatus("reserved");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm(buyerInfo: BuyerInfo) {
    if (purchaseMode === "external") {
      handleClaim(buyerInfo);
    }
  }

  function handleReserved() {
    if (!multiPurchase) setStatus("reserved");
  }

  return (
    <>
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
          {gift.price > 0 && (
            <p className="mb-4 text-lg font-bold text-primary">
              {formatPrice(gift.price)}
            </p>
          )}

          {isAvailable ? (
            <div className="flex flex-col gap-2">
              {purchaseMode === "external" && gift.externalUrl && (
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
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                {loading ? "Processando..." : "Presentear"}
              </button>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          ) : (
            <div className="rounded-lg bg-section-alt px-4 py-2 text-center text-sm text-muted">
              {status === "reserved"
                ? "Presente sendo pago"
                : "Presente reservado"}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ClaimModal
          giftId={gift._id}
          giftName={gift.name}
          externalUrl={gift.externalUrl}
          mode={purchaseMode}
          pixQrCodeUrl={pixQrCodeUrl}
          pixPayload={pixPayload}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
          onReserved={handleReserved}
        />
      )}
    </>
  );
}
