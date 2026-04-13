import Link from "next/link";
import { getMongoClient } from "@/lib/mongodb";
import { releaseExpiredReservations } from "@/lib/gifts";
import GiftCard from "@/components/GiftCard";
import PixSection from "@/components/PixSection";
import type { Gift, PixSettings } from "@/data/types";

export const metadata = {
  title: "Lista de Presentes — Carol & João",
};

export default async function PresentesPage() {
  await releaseExpiredReservations();

  const client = await getMongoClient();
  const db = client.db("carol-joao");

  const docs = await db
    .collection("gifts")
    .find({ status: { $ne: "purchased" } })
    .sort({ sortOrder: 1 })
    .toArray();
  const gifts = docs.map((d) => ({ ...d, _id: d._id.toString() })) as Gift[];

  const pixDoc = await db.collection("settings").findOne({ key: "pix" });
  const pixSettings = pixDoc?.value as PixSettings | undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-4">
          <Link href="/" className="text-sm text-muted hover:text-primary">
            &larr; Voltar ao site
          </Link>
        </div>

        <div className="mb-12 text-center">
          <h1 className="mb-3 font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
            Lista de Presentes
          </h1>
          <p className="text-muted">
            Sua presença é o nosso maior presente! Mas se quiser nos presentear,
            aqui estão algumas sugestões.
          </p>
        </div>

        {gifts.length > 0 && (
          <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard key={gift._id} gift={gift} />
            ))}
          </div>
        )}

        {pixSettings && <PixSection settings={pixSettings} />}
      </div>
    </div>
  );
}
