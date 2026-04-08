"use client";

import { useActionState } from "react";
import type { GiftResult } from "@/app/actions/admin-gifts";

interface Props {
  action: (prev: GiftResult, formData: FormData) => Promise<GiftResult>;
  defaultValues?: {
    name?: string;
    description?: string;
    imageUrl?: string;
    price?: string;
    externalUrl?: string;
    status?: string;
  };
  showStatus?: boolean;
}

export default function GiftForm({ action, defaultValues = {}, showStatus }: Props) {
  const [state, formAction, pending] = useActionState(action, { success: false });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          Nome do presente *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues.name}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-foreground">
          URL da imagem
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues.imageUrl}
          placeholder="https://..."
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium text-foreground">
          Preço (R$) *
        </label>
        <input
          id="price"
          name="price"
          type="text"
          required
          defaultValue={defaultValues.price}
          placeholder="159,90"
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="externalUrl" className="mb-1 block text-sm font-medium text-foreground">
          Link do MercadoLivre
        </label>
        <input
          id="externalUrl"
          name="externalUrl"
          type="url"
          defaultValue={defaultValues.externalUrl}
          placeholder="https://www.mercadolivre.com.br/..."
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {showStatus && (
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues.status ?? "available"}
            className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="available">Disponível</option>
            <option value="reserved">Reservado</option>
            <option value="purchased">Comprado</option>
          </select>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Salvo com sucesso!</p>}

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
