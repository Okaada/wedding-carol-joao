"use client";

import { useState } from "react";

interface ClaimModalProps {
  giftId: string;
  giftName: string;
  externalUrl?: string;
  mode: "external" | "mercadopago";
  pixQrCodeUrl?: string;
  pixPayload?: string;
  onClose: () => void;
  onConfirm: (buyerInfo: BuyerInfo) => void;
}

export interface BuyerInfo {
  buyerName: string;
  buyerType: "individual" | "couple" | "group";
  buyerNames: string[];
}

export default function ClaimModal({
  giftName,
  externalUrl,
  mode,
  pixQrCodeUrl,
  pixPayload,
  onClose,
  onConfirm,
}: ClaimModalProps) {
  const [buyerType, setBuyerType] = useState<"individual" | "couple" | "group">("individual");
  const [primaryName, setPrimaryName] = useState("");
  const [extraNames, setExtraNames] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedPrimary = primaryName.trim();
    if (!trimmedPrimary) {
      setError("Informe seu nome.");
      return;
    }

    const allNames = [trimmedPrimary];

    if (buyerType === "couple" || buyerType === "group") {
      const extras = extraNames.map((n) => n.trim()).filter(Boolean);
      if (extras.length < 1) {
        setError(
          buyerType === "couple"
            ? "Informe o nome do(a) parceiro(a)."
            : "Informe pelo menos mais um nome do grupo.",
        );
        return;
      }
      allNames.push(...extras);
    }

    onConfirm({
      buyerName: trimmedPrimary,
      buyerType,
      buyerNames: allNames,
    });
  }

  function addExtraName() {
    setExtraNames([...extraNames, ""]);
  }

  function updateExtraName(index: number, value: string) {
    const updated = [...extraNames];
    updated[index] = value;
    setExtraNames(updated);
  }

  function removeExtraName(index: number) {
    if (extraNames.length <= 1) return;
    setExtraNames(extraNames.filter((_, i) => i !== index));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h3 className="mb-1 font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground">
          Presentear
        </h3>
        <p className="mb-4 text-sm text-muted">{giftName}</p>

        {externalUrl && mode === "external" && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Ver no MercadoLivre
          </a>
        )}

        {pixQrCodeUrl && mode === "external" && (
          <div className="mb-4 rounded-lg border border-accent bg-section-alt p-4 text-center">
            <p className="mb-2 text-sm font-medium text-foreground">
              Pague via PIX
            </p>
            <div className="mx-auto mb-3 inline-block rounded-lg border border-accent bg-white p-1">
              <img
                src={pixQrCodeUrl}
                alt="QR Code PIX"
                width={200}
                height={200}
              />
            </div>
            {pixPayload && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload);
                  setPixCopied(true);
                  setTimeout(() => setPixCopied(false), 2000);
                }}
                className="mx-auto block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {pixCopied ? "Copiado!" : "Copiar código PIX"}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Quem está presenteando?
            </label>
            <div className="flex gap-2">
              {([
                ["individual", "Sozinho(a)"],
                ["couple", "Casal"],
                ["group", "Grupo"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setBuyerType(value);
                    if (value === "individual") setExtraNames([""]);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    buyerType === value
                      ? "border-primary bg-primary text-white"
                      : "border-accent text-foreground hover:border-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="primaryName" className="mb-1 block text-sm font-medium text-foreground">
              Seu nome *
            </label>
            <input
              id="primaryName"
              type="text"
              value={primaryName}
              onChange={(e) => setPrimaryName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          {(buyerType === "couple" || buyerType === "group") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {buyerType === "couple" ? "Nome do(a) parceiro(a) *" : "Nomes do grupo *"}
              </label>
              <div className="space-y-2">
                {extraNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateExtraName(i, e.target.value)}
                      placeholder="Nome completo"
                      className="flex-1 rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                    {buyerType === "group" && extraNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExtraName(i)}
                        className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {buyerType === "group" && (
                <button
                  type="button"
                  onClick={addExtraName}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  + Adicionar nome
                </button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-section-alt"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
