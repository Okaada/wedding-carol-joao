"use client";

import { useState, useTransition } from "react";
import { setMercadopagoCheckoutProEnabled } from "@/app/actions/admin-settings";

export default function MercadopagoCheckoutProToggle({
  defaultEnabled,
  isConfigured,
}: {
  defaultEnabled: boolean;
  isConfigured: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setMercadopagoCheckoutProEnabled(next);
      if (result.success) {
        setSaved(true);
      } else {
        setEnabled(!next);
        setError(result.error ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="max-w-lg space-y-2 rounded-lg border border-accent bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Checkout Pro (Mercado Pago)
          </p>
          <p className="text-xs text-muted">
            Quando ativo, o convidado é redirecionado direto para o checkout do
            Mercado Pago em vez de copiar o valor manualmente.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={pending}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-primary" : "bg-accent"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <p className="text-xs">
        Chave de acesso configurada no servidor:{" "}
        <span
          className={
            isConfigured
              ? "font-semibold text-green-600"
              : "font-semibold text-amber-600"
          }
        >
          {isConfigured ? "Sim" : "Não"}
        </span>
      </p>

      {!isConfigured && (
        <p className="text-xs text-amber-600">
          Ativar aqui não terá efeito até a chave (MERCADOPAGO_ACCESS_TOKEN)
          ser configurada no ambiente do servidor. Até lá, o link de
          pagamento aberto continua sendo usado normalmente.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-green-600">Configuração salva!</p>
      )}
    </div>
  );
}
