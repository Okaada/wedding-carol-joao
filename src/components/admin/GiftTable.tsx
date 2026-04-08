"use client";

import Link from "next/link";
import { deleteGift } from "@/app/actions/admin-gifts";
import { formatPrice } from "@/lib/format";
import GiftStatusBadge from "./GiftStatusBadge";
import type { Gift } from "@/data/types";

export default function GiftTable({ gifts }: { gifts: Gift[] }) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este presente?")) return;
    await deleteGift(id);
    window.location.reload();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-accent">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-accent bg-section-alt">
          <tr>
            <th className="px-4 py-3 font-medium text-muted">Imagem</th>
            <th className="px-4 py-3 font-medium text-muted">Nome</th>
            <th className="px-4 py-3 font-medium text-muted">Preço</th>
            <th className="px-4 py-3 font-medium text-muted">Status</th>
            <th className="px-4 py-3 font-medium text-muted">Ações</th>
          </tr>
        </thead>
        <tbody>
          {gifts.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted">
                Nenhum presente cadastrado.
              </td>
            </tr>
          ) : (
            gifts.map((gift) => (
              <tr key={gift._id} className="border-b border-accent/50 last:border-0">
                <td className="px-4 py-3">
                  {gift.imageUrl ? (
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/30 text-xs text-muted">
                      —
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground">{gift.name}</td>
                <td className="px-4 py-3 text-foreground">{formatPrice(gift.price)}</td>
                <td className="px-4 py-3">
                  <GiftStatusBadge status={gift.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/gifts/${gift._id}/edit`}
                      className="rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(gift._id)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
