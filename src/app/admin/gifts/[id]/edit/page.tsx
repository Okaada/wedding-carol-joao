import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import GiftForm from "@/components/admin/GiftForm";
import { updateGift } from "@/app/actions/admin-gifts";
import { formatDate } from "@/lib/format";
import type { Purchase } from "@/data/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGiftPage({ params }: Props) {
  const { id } = await params;

  let gift;
  try {
    const client = await getMongoClient();
    gift = await client
      .db("carol-joao")
      .collection("gifts")
      .findOne({ _id: new ObjectId(id) });
  } catch {
    notFound();
  }

  if (!gift) notFound();

  const boundUpdate = updateGift.bind(null, id);
  const singlePurchase = (gift.singlePurchase as boolean | undefined) ?? false;
  const purchases = (gift.purchases as Purchase[] | undefined) ?? [];

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/gifts" className="text-sm text-muted hover:text-primary">
          &larr; Voltar
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          Editar Presente
        </h1>
      </div>
      <GiftForm
        action={boundUpdate}
        showStatus
        defaultValues={{
          name: gift.name as string,
          description: gift.description as string,
          imageUrl: gift.imageUrl as string,
          price: ((gift.price as number) / 100).toFixed(2).replace(".", ","),
          externalUrl: gift.externalUrl as string,
          status: gift.status as string,
          purchaseMode: (gift.purchaseMode as string) ?? "mercadopago",
          singlePurchase,
          buyerType: (gift.buyerType as string) ?? "",
          buyerName: (gift.buyerName as string) ?? "",
          buyerNames: (gift.buyerNames as string[]) ?? [],
        }}
      />

      {!singlePurchase && purchases.length > 0 && (
        <div className="mt-8 max-w-lg">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground">
            Histórico de compras ({purchases.length})
          </h2>
          <ul className="space-y-2 rounded-lg border border-accent bg-section-alt p-4">
            {purchases.map((p, i) => (
              <li
                key={i}
                className="flex flex-col gap-0.5 border-b border-accent/40 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {p.buyerType === "couple"
                      ? p.buyerNames.join(" & ")
                      : p.buyerType === "group"
                        ? p.buyerNames.join(", ")
                        : p.buyerName}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.buyerType === "individual"
                        ? "bg-gray-100 text-gray-700"
                        : p.buyerType === "couple"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {p.buyerType === "individual"
                      ? "Individual"
                      : p.buyerType === "couple"
                        ? "Casal"
                        : "Grupo"}
                  </span>
                  <span className="text-xs text-muted">
                    {p.source === "mercadopago" ? "Mercado Pago" : "Externo/PIX"}
                  </span>
                </div>
                <span className="text-xs text-muted">{formatDate(p.purchasedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
