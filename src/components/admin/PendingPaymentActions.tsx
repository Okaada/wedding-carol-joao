"use client";

import { useState, useTransition } from "react";
import {
  confirmPendingPaymentAction,
  cancelPendingPaymentAction,
} from "@/app/actions/admin-pending-payments";

export default function PendingPaymentActions({ pendingId }: { pendingId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(pendingId);
      if (!result.success) {
        setError(result.error ?? "Erro ao processar.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(confirmPendingPaymentAction)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          Confirmar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(cancelPendingPaymentAction)}
          className="rounded-md border border-accent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-section-alt disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
