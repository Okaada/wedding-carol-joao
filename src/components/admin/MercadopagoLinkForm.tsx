"use client";

import { useState, useTransition } from "react";
import { setMercadopagoPaymentLink } from "@/app/actions/admin-settings";

export default function MercadopagoLinkForm({
  defaultUrl,
}: {
  defaultUrl: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setMercadopagoPaymentLink(url);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3">
      <div>
        <label
          htmlFor="mercadopagoLink"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Link de pagamento Mercado Pago *
        </label>
        <input
          id="mercadopagoLink"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://link.mercadopago.com.br/..."
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted">
          Cole o link aberto gerado no painel do Mercado Pago.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Link salvo!</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
