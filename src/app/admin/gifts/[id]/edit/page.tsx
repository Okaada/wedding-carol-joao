import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import GiftForm from "@/components/admin/GiftForm";
import { updateGift } from "@/app/actions/admin-gifts";

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
          buyerType: (gift.buyerType as string) ?? "",
          buyerName: (gift.buyerName as string) ?? "",
          buyerNames: (gift.buyerNames as string[]) ?? [],
        }}
      />
    </div>
  );
}
