"use client";

import { useActionState } from "react";
import { savePixSettings } from "@/app/actions/admin-settings";
import type { PixSettings } from "@/data/types";

export default function PixSettingsForm({
  defaults,
}: {
  defaults?: PixSettings;
}) {
  const [state, formAction, pending] = useActionState(savePixSettings, {
    success: false,
  });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="keyType" className="mb-1 block text-sm font-medium text-foreground">
          Tipo de chave *
        </label>
        <select
          id="keyType"
          name="keyType"
          defaultValue={defaults?.keyType ?? "cpf"}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="cpf">CPF</option>
          <option value="email">E-mail</option>
          <option value="phone">Telefone</option>
          <option value="random">Chave aleatória</option>
        </select>
      </div>

      <div>
        <label htmlFor="keyValue" className="mb-1 block text-sm font-medium text-foreground">
          Chave PIX *
        </label>
        <input
          id="keyValue"
          name="keyValue"
          type="text"
          required
          defaultValue={defaults?.keyValue}
          placeholder="Sua chave PIX"
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="recipientName" className="mb-1 block text-sm font-medium text-foreground">
          Nome do recebedor *
        </label>
        <input
          id="recipientName"
          name="recipientName"
          type="text"
          required
          defaultValue={defaults?.recipientName}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-foreground">
          Cidade *
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          defaultValue={defaults?.city}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">Configurações salvas!</p>
      )}

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
